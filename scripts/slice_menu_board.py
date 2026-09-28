"""Slice the supplied menu board into one image per menu item.

The board (``food items list/*.png``) is a 1536x1024 poster of labelled
product photos. The tiles butt against each other with no gutters, so they
cannot be found by looking for gaps. Instead each tile is located from its
*caption*: the dark label text under every photo sits in a known strip, and
grouping the dark pixel columns in that strip yields one cluster per tile.
The cluster centre is the tile centre, and the photo is the band directly
above the caption.

Output: ``public/images/items/<slug>.webp``

Run:  python scripts/slice_menu_board.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "food items list"
OUT_DIR = ROOT / "public" / "images" / "items"

# One entry per caption row on the board.
#   cap_y0/cap_y1 : the caption strip to scan for label text
#   x0/x1         : horizontal bounds of the panel
#   img_y0/img_y1 : the photo band to crop (above the caption)
#   labels        : item names, left to right — must match what is printed
ROWS = [
    # ---- PIZZA (3 rows) ----
    dict(cap=(108, 124), x=(0, 415), img=(36, 106), labels=[
        "Margarita", "Pepperoni", "Romana", "Vegetarian", "Vegetarian Hot"]),
    dict(cap=(194, 210), x=(0, 415), img=(122, 192), labels=[
        "Chicken Feast", "Flaming Chicken", "Hawaiian", "Hot & Spicy", "Meat Feast"]),
    dict(cap=(283, 299), x=(0, 415), img=(211, 281), labels=[
        "BBQ Chicken", "Sea Food Tuna", "American Special", "Create Your Own"]),

    # ---- PIZZA EXTRA TOPPINGS (2 rows) ----
    dict(cap=(396, 410), x=(0, 545), img=(346, 394), labels=[
        "Mushroom", "Cheese topping", "Peppers", "Sweetcorn", "Tomatoes",
        "Jalapeno", "Ham", "Pork Sausage"]),
    dict(cap=(479, 493), x=(0, 545), img=(430, 477), labels=[
        "Chicken topping", "Spicy Chicken", "Spicy Beef", "Pepperoni topping",
        "Meat Balls", "Olives", "Tuna", "Anchovies", "Prawn"]),

    # ---- STARTERS (3 rows) ----
    dict(cap=(631, 646), x=(0, 545), img=(566, 629), labels=[
        "3 Hot & Spicy Wings", "5 Hot & Spicy Wings", "10 Hot & Spicy Wings",
        "4 Hot & Spicy Dippers", "4 Chicken Strips"]),
    dict(cap=(733, 748), x=(0, 545), img=(668, 731), labels=[
        "4 Hash Browns", "6 Chicken Nuggets", "12 Chicken Nuggets",
        "20 Chicken Nuggets", "12 Onion Rings"],),
    dict(cap=(836, 858), x=(0, 545), img=(771, 834), labels=[
        "Reg Chicken Popcorn", "Large Chicken Popcorn", "12 Garlic Mushrooms + Dip",
        "Potato Wedges + Dip", "Chilli Cheese Bites (6)"]),

    # ---- GARLIC BREAD (3 single-tile rows) ----
    dict(cap=(101, 116), x=(410, 545), img=(50, 99), labels=["Garlic Bread"]),
    dict(cap=(190, 205), x=(410, 545), img=(140, 188), labels=["Cheese Garlic Bread"]),
    dict(cap=(283, 298), x=(410, 545), img=(233, 281), labels=["Tomato Garlic Bread"]),

    # ---- BURGERS (2 rows) ----
    dict(cap=(136, 150), x=(550, 990), img=(40, 134), labels=[
        "Chicken Fillet Burger", "Zinger Fillet Burger", "Tower Burger",
        "Cod Fillet Burger"]),
    dict(cap=(259, 273), x=(550, 990), img=(163, 257), labels=[
        "Veggi Burger", "1/4 LB Cheese Burger", "1/2 LB Cheese Burger",
        "Chicken Wrap"]),

    # ---- MAIN ITEMS / CHICKEN (2 rows) ----
    dict(cap=(415, 430), x=(550, 990), img=(345, 413), labels=[
        "Chicken Fillet", "Chicken Strips", "Chicken Nuggets", "Chicken Popcorn"]),
    dict(cap=(522, 537), x=(550, 990), img=(452, 520), labels=[
        "Hot Wings", "Hot & Spicy Wings", "Hot & Spicy Dippers", "Spicy Dippers"]),

    # ---- AMERICAN'S CHICKEN (2 rows) ----
    dict(cap=(667, 682), x=(550, 990), img=(597, 665), labels=[
        "1 Pc Chicken", "2 Pcs Chicken", "3 Pcs Chicken", "6 Pcs Chicken"]),
    dict(cap=(771, 786), x=(550, 800), img=(701, 769), labels=[
        "8 Pcs Chicken", "12 Pcs Chicken"]),

    # ---- SIDES (2 rows) ----
    dict(cap=(861, 875), x=(550, 860), img=(820, 859), labels=[
        "Chips", "Chicken Gravy", "BBQ Beans", "Coleslaw", "Corn Cobbettes (2)"]),
    dict(cap=(950, 985), x=(550, 860), img=(900, 948), labels=[
        "Cheese Slice", "Red Salt", "Mayo Dip", "BBQ Sauce", "Ketchup",
        "Chilli Sauce"]),

    # ---- DRINKS (2 rows) ----
    dict(cap=(884, 898), x=(860, 1195), img=(834, 882), labels=[
        "Pepsi Can", "Diet Pepsi Can", "Coke Can", "7UP Can", "Tango Can"]),
    dict(cap=(966, 1000), x=(860, 1195), img=(905, 964), labels=[
        "Pepsi Max Can", "Vimto Can", "1.5L Bottle", "Fruit Shoot"]),

    # ---- BURGER MEALS (3 rows) ----
    dict(cap=(136, 150), x=(995, 1530), img=(40, 134), labels=[
        "1/4 Cheese Burger Meal", "Cod Burger Meal", "Fillet Burger Meal",
        "Tower Burger Meal"]),
    dict(cap=(253, 267), x=(995, 1530), img=(157, 251), labels=[
        "Veggi Burger Meal", "Chicken Dinner", "Chicken Nugget Meal",
        "Chicken Popcorn Meal"]),
    dict(cap=(370, 384), x=(995, 1530), img=(274, 368), labels=[
        "Chicken Strip Meal", "Spicy Dipper Meal", "Variety Meal",
        "Chicken Wrap Meal"]),

    # ---- FAMILY TREATS / BUCKETS (3 rows) ----
    dict(cap=(533, 547), x=(995, 1530), img=(440, 531), labels=[
        "Hot Wings Meal", "Full House", "Box Meal", "Boneless Meal"]),
    dict(cap=(647, 661), x=(995, 1530), img=(554, 645), labels=[
        "Boneless Bucket", "Family Feast Meal", "Family Value Meal",
        "Bargain Buckets"]),
    dict(cap=(762, 776), x=(995, 1400), img=(669, 760), labels=[
        "Variety Bucket", "Party Meal", "Family Box"]),

    # ---- DESSERTS (2 rows) ----
    dict(cap=(866, 880), x=(1200, 1530), img=(812, 864), labels=[
        "Hot Apple Pie", "Chocolate Doughnut", "Chocolate Fudge Cake"]),
    dict(cap=(975, 1000), x=(1200, 1530), img=(898, 973), labels=[
        "Chocolate Cheese Cake", "Strawberry Cheese Cake",
        "Ben & Jerry's (100ml)", "Ben & Jerry's (500ml)"]),
]


def slug(name: str) -> str:
    out = []
    for ch in name.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " -/&+().":
            out.append("-")
    s = "".join(out)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")


def caption_centres(dark: np.ndarray, x0: int, x1: int, gap: int = 7):
    """Centres of each dark-text cluster in a caption strip."""
    profile = dark[:, x0:x1].sum(axis=0)
    cols = np.where(profile > 0)[0]
    if len(cols) == 0:
        return []
    groups, cur = [], [cols[0]]
    for c in cols[1:]:
        if c - cur[-1] <= gap:
            cur.append(c)
        else:
            groups.append(cur)
            cur = [c]
    groups.append(cur)
    # Ignore specks; a real caption is several pixels wide
    return [x0 + (g[0] + g[-1]) // 2 for g in groups if len(g) >= 8]


def main() -> None:
    src = next(iter(sorted(SRC_DIR.glob("*.png"))), None)
    if src is None:
        raise SystemExit(f"no board image found in {SRC_DIR}")

    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(int)
    dark_all = (arr < 120).all(axis=2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written, skipped = 0, []

    for row in ROWS:
        cy0, cy1 = row["cap"]
        x0, x1 = row["x"]
        iy0, iy1 = row["img"]
        labels = row["labels"]

        centres = caption_centres(dark_all[cy0:cy1], x0, x1)
        if len(centres) != len(labels):
            skipped.append(f"{labels[0]!r} row: found {len(centres)} captions "
                           f"for {len(labels)} labels")
            # Fall back to an even split of the panel so the row still yields
            # images rather than none at all.
            step = (x1 - x0) / len(labels)
            centres = [int(x0 + step * (i + 0.5)) for i in range(len(labels))]

        # Tile width is the spacing between neighbouring centres
        if len(centres) > 1:
            pitch = int(np.median(np.diff(centres)))
        else:
            pitch = x1 - x0
        half = max(12, int(pitch * 0.46))

        for cx, label in zip(centres, labels):
            left, right = max(0, cx - half), min(im.width, cx + half)
            tile = im.crop((left, iy0, right, iy1))
            w, h = tile.size
            tile = tile.resize((w * 4, h * 4), Image.LANCZOS)
            tile.save(OUT_DIR / f"{slug(label)}.webp", "WEBP",
                      quality=88, method=6)
            written += 1

    print(f"wrote {written} item images to {OUT_DIR.relative_to(ROOT)}")
    for s in skipped:
        print("  note:", s)


if __name__ == "__main__":
    main()
