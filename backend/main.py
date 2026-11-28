import json
import os
import re
import uuid
from io import BytesIO
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps
from pydantic import BaseModel, Field

from db import get_db_connection

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_DIGITS_PATTERN = re.compile(r"^\+?\d{7,15}$")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_RAW_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_DIMENSION = 1400
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


class SubscriberCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=180)
    phone: str = Field(..., min_length=7, max_length=40)


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=180)
    phone: str | None = Field(default=None, max_length=40)
    message: str = Field(..., min_length=5, max_length=2000)


class ProductCreate(BaseModel):
    id: str | None = Field(default=None, max_length=100)
    name: str = Field(..., min_length=1, max_length=150)
    title: str | None = Field(default=None, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0)
    colors: list[str] = Field(default_factory=list)
    stock_count: int = Field(default=0, ge=0)
    is_available: bool = True
    is_new: bool = False
    description: str = Field(default="", max_length=2000)
    image_url: str = Field(default="", max_length=500)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    title: str | None = Field(default=None, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price: float | None = Field(default=None, ge=0)
    colors: list[str] | None = None
    stock_count: int | None = Field(default=None, ge=0)
    is_available: bool | None = None
    is_new: bool | None = None
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)


def normalize_and_validate_email(raw_email: str | None, required: bool = False) -> str | None:
    cleaned = raw_email.strip().lower() if raw_email else ""
    if not cleaned:
        if required:
            raise HTTPException(status_code=400, detail="Email is required.")
        return None
    if not EMAIL_PATTERN.match(cleaned):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    return cleaned


def normalize_and_validate_phone(raw_phone: str | None, required: bool = False) -> str | None:
    cleaned = raw_phone.strip() if raw_phone else ""
    if not cleaned:
        if required:
            raise HTTPException(status_code=400, detail="Phone number is required.")
        return None
    normalized = re.sub(r"[()\s-]", "", cleaned)
    if not PHONE_DIGITS_PATTERN.match(normalized):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid phone number (7 to 15 digits).",
        )
    return normalized


app = FastAPI(title="ARCHIVE Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "archive_store_api"}


@app.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_product_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Please upload JPG, PNG, or WebP.",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_RAW_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Image file is too large (10 MB maximum).",
        )

    try:
        img = Image.open(BytesIO(raw_bytes))
        img = ImageOps.exif_transpose(img)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

        filename = f"{uuid.uuid4().hex}.webp"
        file_path = os.path.join(UPLOAD_DIR, filename)
        img.save(file_path, format="WEBP", quality=82, method=6)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process image file.")

    image_url = f"{APP_BASE_URL}/uploads/{filename}"
    return {
        "message": "Image uploaded and compressed successfully",
        "image_url": image_url,
    }


@app.get("/products")
def list_products():
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id, name, title, category, price, colors,
                    stock_count, is_available, is_new, description,
                    image_url, created_at
                FROM products
                ORDER BY created_at ASC
                """
            )
            rows = cursor.fetchall()

        for row in rows:
            if isinstance(row.get("colors"), str):
                row["colors"] = json.loads(row["colors"])

        return {"products": rows}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


@app.get("/products/{product_id}")
def get_product(product_id: str):
    clean_id = product_id.strip()
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id, name, title, category, price, colors,
                    stock_count, is_available, is_new, description,
                    image_url, created_at
                FROM products
                WHERE id = %s
                """,
                (clean_id,),
            )
            product = cursor.fetchone()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product '{clean_id}' not found")

        if isinstance(product.get("colors"), str):
            product["colors"] = json.loads(product["colors"])

        return {"product": product}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


@app.post("/subscribers", status_code=201)
def create_subscriber(payload: SubscriberCreate):
    clean_email = normalize_and_validate_email(payload.email, required=True)
    clean_phone = normalize_and_validate_phone(payload.phone, required=True)

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO subscribers (email, phone)
                VALUES (%s, %s)
                """,
                (clean_email, clean_phone),
            )
            new_id = cursor.lastrowid

        conn.commit()
        return {
            "message": "Subscriber added successfully",
            "subscriber": {
                "id": new_id,
                "email": clean_email,
                "phone": clean_phone,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


@app.post("/contact", status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate):
    clean_name = payload.name.strip()
    clean_message = payload.message.strip()
    clean_email = normalize_and_validate_email(payload.email, required=False)
    clean_phone = normalize_and_validate_phone(payload.phone, required=False)

    if len(clean_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must be at least 2 characters long.",
        )

    if len(clean_message) < 5:
        raise HTTPException(
            status_code=400,
            detail="Message must be at least 5 characters long.",
        )

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=400,
            detail="Provide at least a valid email address or phone number.",
        )

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO contacts (name, email, phone, message)
                VALUES (%s, %s, %s, %s)
                """,
                (clean_name, clean_email, clean_phone, clean_message),
            )
            new_id = cursor.lastrowid

        conn.commit()
        return {
            "message": "Contact message saved successfully",
            "contact": {
                "id": new_id,
                "name": clean_name,
                "email": clean_email,
                "phone": clean_phone,
                "message": clean_message,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


def _format_product_row(row: dict[str, Any]) -> dict[str, Any]:
    if row and isinstance(row.get("colors"), str):
        try:
            row["colors"] = json.loads(row["colors"])
        except Exception:
            row["colors"] = []
    return row


@app.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate):
    product_id = payload.id.strip() if payload.id and payload.id.strip() else f"prod-{uuid.uuid4().hex[:8]}"
    clean_name = payload.name.strip()
    clean_title = payload.title.strip() if payload.title and payload.title.strip() else clean_name
    clean_category = payload.category.strip()
    clean_description = payload.description.strip()
    clean_image_url = payload.image_url.strip()
    colors_json = json.dumps([c.strip() for c in payload.colors if c and c.strip()])

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO products (
                    id, name, title, category, price, colors,
                    stock_count, is_available, is_new, description, image_url
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    product_id,
                    clean_name,
                    clean_title,
                    clean_category,
                    payload.price,
                    colors_json,
                    payload.stock_count,
                    int(payload.is_available),
                    int(payload.is_new),
                    clean_description,
                    clean_image_url,
                ),
            )
            cursor.execute(
                """
                SELECT
                    id, name, title, category, price, colors,
                    stock_count, is_available, is_new, description,
                    image_url, created_at
                FROM products
                WHERE id = %s
                """,
                (product_id,),
            )
            created = cursor.fetchone()

        conn.commit()
        return {
            "message": "Product created successfully",
            "product": _format_product_row(created),
        }
    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


@app.patch("/products/{product_id}")
@app.put("/products/{product_id}")
def update_product(product_id: str, payload: ProductUpdate):
    clean_id = product_id.strip()
    updates: list[str] = []
    params: list[Any] = []

    if payload.name is not None:
        updates.append("name = %s")
        params.append(payload.name.strip())
    if payload.title is not None:
        updates.append("title = %s")
        params.append(payload.title.strip())
    if payload.category is not None:
        updates.append("category = %s")
        params.append(payload.category.strip())
    if payload.price is not None:
        updates.append("price = %s")
        params.append(payload.price)
    if payload.colors is not None:
        updates.append("colors = %s")
        params.append(json.dumps([c.strip() for c in payload.colors if c and c.strip()]))
    if payload.stock_count is not None:
        updates.append("stock_count = %s")
        params.append(payload.stock_count)
    if payload.is_available is not None:
        updates.append("is_available = %s")
        params.append(int(payload.is_available))
    if payload.is_new is not None:
        updates.append("is_new = %s")
        params.append(int(payload.is_new))
    if payload.description is not None:
        updates.append("description = %s")
        params.append(payload.description.strip())
    if payload.image_url is not None:
        updates.append("image_url = %s")
        params.append(payload.image_url.strip())

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    params.append(clean_id)

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM products WHERE id = %s", (clean_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Product '{clean_id}' not found")

            cursor.execute(
                f"UPDATE products SET {', '.join(updates)} WHERE id = %s",
                tuple(params),
            )

            cursor.execute(
                """
                SELECT
                    id, name, title, category, price, colors,
                    stock_count, is_available, is_new, description,
                    image_url, created_at
                FROM products
                WHERE id = %s
                """,
                (clean_id,),
            )
            updated = cursor.fetchone()

        conn.commit()
        return {
            "message": "Product updated successfully",
            "product": _format_product_row(updated),
        }
    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()


@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    clean_id = product_id.strip()
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM products WHERE id = %s", (clean_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail=f"Product '{clean_id}' not found")

        conn.commit()
        return {
            "message": "Product deleted successfully",
            "id": clean_id,
        }
    except HTTPException:
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    finally:
        if conn:
            conn.close()