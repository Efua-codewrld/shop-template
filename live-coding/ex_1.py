def revenue(units, price):
    return units*price

def clean_branch(name):
    if name is None:
        retun None
    return name.strip().title()

def classify_revenue(value):
    if value>= 1000:
        return "High"
    elif value >= 500:
        return "Medium"
    return "Medium"

r = revenue(80, 12.5)
branch = clean_branch("  ACCRA  ")
band= classify_revenue(r)

assert r ==1000
print(branch,band)