// ============================================================================
// AMERICAN FRIED CHICKEN — Bolton
// Menu data: the single source of truth for the storefront AND the admin
// dashboard (Admin reads this through CartContext, so editing here updates
// both).
//
// PRICES: every item is 0.00 by design. Real prices are set in the admin
// dashboard, which stores overrides in Firestore keyed by item id — so the
// ids below must stay stable once prices have been entered against them.
//
// IMAGES: sliced from the supplied menu board by scripts/slice_menu_board.py
// into /images/items/. Items not pictured on that board (the milkshakes) fall
// back to a per-category placeholder — replace those from the admin
// dashboard.
// ============================================================================

export const categories = [
  "Drinks (Beverages)",
  "Burgers",
  "Burger Meals",
  "Main Items",
  "Pizza",
  "Garlic Bread",
  "Starters",
  "Family Treats",
  "Sides",
  "Desserts"
];

// Category placeholder art, generated in the brand palette. Used wherever an
// item has no photograph of its own.
const ph = {
  drinks: '/images/Main Img Category/Drinks (Beverages).png',
  burgers: '/images/Main Img Category/Burgers.png',
  burgerMeals: '/images/Main Img Category/Burger Meals.png',
  main: '/images/Main Img Category/Main items.png',
  pizza: '/images/Main Img Category/Pizza.png',
  garlic: '/images/Main Img Category/Garlic Bread.png',
  starters: '/images/Main Img Category/Starters.png',
  family: '/images/Main Img Category/Family Treats.png',
  sides: '/images/Main Img Category/Sides.png',
  desserts: '/images/Main Img Category/Desserts.png',
};

const P = 0.00; // every price is set in the admin dashboard

// --- Shared option groups ---------------------------------------------------

const cheeseAddon = [{ id: 'ao_cheese', name: 'Add Cheese', price: 0 }];

// Drinks offered with meal deals (single-select)
const drinkChoices = [
  'Pepsi', 'Diet Pepsi', 'Coke', '7UP', 'Tango', 'Pepsi Max', 'Vimto',
].map(name => ({ name }));

const mealOptions = [
  { id: 'drink', label: 'Choose your drink', note: 'Choose 1', required: true, multi: false, choices: drinkChoices },
];

const burgerMealOptions = [
  { id: 'lettuce', label: 'Lettuce', note: 'Choose 1', required: true, multi: false, choices: [{ name: 'Lettuce' }, { name: 'No Lettuce' }] },
  { id: 'mayo', label: 'Mayo', note: 'Choose 1', required: true, multi: false, choices: [{ name: 'Mayo' }, { name: 'No Mayo' }] },
  { id: 'cheese', label: 'Add cheese', note: '', required: false, multi: true, choices: [{ name: 'Cheese', price: 0 }] },
  { id: 'drink', label: 'Choose your drink', note: 'Choose 1', required: true, multi: false, choices: drinkChoices },
];

// Pizza toppings — offered as paid extras on every pizza
const pizzaExtras = [
  'Mushroom', 'Cheese', 'Peppers', 'Sweetcorn', 'Tomatoes', 'Jalapeno', 'Ham',
  'Pork Sausage', 'Chicken', 'Spicy Chicken', 'Spicy Beef', 'Pepperoni',
  'Meat Balls', 'Olives', 'Tuna', 'Anchovies', 'Prawn',
].map(name => ({ name, price: 0 }));

const pizzaOptions = [
  { id: 'size', label: 'Size', note: 'Choose 1', required: true, multi: false,
    choices: [{ name: '10" Small' }, { name: '12" Medium' }, { name: '14" Large' }] },
  { id: 'extras', label: 'Extra toppings', note: 'Optional', required: false, multi: true, choices: pizzaExtras },
];

const dipChoices = [
  { id: 'dip', label: 'Choose a dip', note: 'Choose 1', required: true, multi: false,
    choices: [{ name: 'Mayo' }, { name: 'Garlic Mayo' }, { name: 'BBQ Sauce' }, { name: 'Ketchup' }, { name: 'Chilli Sauce' }] },
];

// --- Menu items -------------------------------------------------------------

export const menuItems = [
  // ---------------------------------------------------------------- Drinks
  { id: 'dr1', category: 'Drinks (Beverages)', title: 'Pepsi Can', price: P, desc: '330ml can', image: '/images/items/pepsi-can.webp' },
  { id: 'dr2', category: 'Drinks (Beverages)', title: 'Diet Pepsi Can', price: P, desc: '330ml can', image: '/images/items/diet-pepsi-can.webp' },
  { id: 'dr3', category: 'Drinks (Beverages)', title: 'Coke Can', price: P, desc: '330ml can', image: '/images/items/coke-can.webp' },
  { id: 'dr4', category: 'Drinks (Beverages)', title: '7UP Can', price: P, desc: '330ml can', image: '/images/items/7up-can.webp' },
  { id: 'dr5', category: 'Drinks (Beverages)', title: 'Tango Can', price: P, desc: '330ml can', image: ph.drinks },
  { id: 'dr6', category: 'Drinks (Beverages)', title: 'Pepsi Max Can', price: P, desc: '330ml can', image: '/images/items/pepsi-max-can.webp' },
  { id: 'dr7', category: 'Drinks (Beverages)', title: 'Vimto Can', price: P, desc: '330ml can', image: '/images/items/vimto-can.webp' },

  { id: 'dr8',  category: 'Drinks (Beverages)', title: '1.5L Pepsi', price: P, desc: '1.5 litre bottle', image: '/images/items/1-5l-bottle.webp' },
  { id: 'dr9',  category: 'Drinks (Beverages)', title: '1.5L Diet Pepsi', price: P, desc: '1.5 litre bottle', image: '/images/items/1-5l-bottle.webp' },
  { id: 'dr10', category: 'Drinks (Beverages)', title: '1.5L Coke', price: P, desc: '1.5 litre bottle', image: '/images/items/1-5l-bottle.webp' },
  { id: 'dr11', category: 'Drinks (Beverages)', title: '1.5L 7UP', price: P, desc: '1.5 litre bottle', image: '/images/items/1-5l-bottle.webp' },
  { id: 'dr12', category: 'Drinks (Beverages)', title: '1.5L Tango', price: P, desc: '1.5 litre bottle', image: '/images/items/1-5l-bottle.webp' },

  { id: 'dr13', category: 'Drinks (Beverages)', title: 'Fruit Shoot — Orange', price: P, desc: '', image: '/images/items/fruit-shoot.webp' },
  { id: 'dr14', category: 'Drinks (Beverages)', title: 'Fruit Shoot — Blackcurrant', price: P, desc: '', image: '/images/items/fruit-shoot.webp' },

  { id: 'dr15', category: 'Drinks (Beverages)', title: 'Kinder Bueno Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },
  { id: 'dr16', category: 'Drinks (Beverages)', title: 'Kit Kat Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },
  { id: 'dr17', category: 'Drinks (Beverages)', title: 'Oreo Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },
  { id: 'dr18', category: 'Drinks (Beverages)', title: 'Ferrero Rocher Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },
  { id: 'dr19', category: 'Drinks (Beverages)', title: 'Strawberry Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },
  { id: 'dr20', category: 'Drinks (Beverages)', title: 'Twirl Milkshake', price: P, desc: 'Thick milkshake', image: ph.drinks },

  // --------------------------------------------------------------- Burgers
  { id: 'bg1', category: 'Burgers', title: 'Chicken Fillet Burger', price: P, desc: '', image: '/images/items/chicken-fillet-burger.webp', addons: cheeseAddon },
  { id: 'bg2', category: 'Burgers', title: 'Zinger Fillet Burger', price: P, desc: '', image: '/images/items/zinger-fillet-burger.webp', addons: cheeseAddon },
  { id: 'bg3', category: 'Burgers', title: 'Tower Burger', price: P, desc: '', image: '/images/items/tower-burger.webp', addons: cheeseAddon },
  { id: 'bg4', category: 'Burgers', title: 'Cod Fillet Burger', price: P, desc: '', image: '/images/items/cod-fillet-burger.webp', addons: cheeseAddon },
  { id: 'bg5', category: 'Burgers', title: 'Veggi Burger', price: P, desc: '', image: '/images/items/veggi-burger.webp', addons: cheeseAddon },
  { id: 'bg6', category: 'Burgers', title: '1/4 LB Cheese Burger', price: P, desc: '', image: '/images/items/1-4-lb-cheese-burger.webp' },
  { id: 'bg7', category: 'Burgers', title: '1/2 LB Cheese Burger', price: P, desc: '', image: '/images/items/1-2-lb-cheese-burger.webp' },
  { id: 'bg8', category: 'Burgers', title: 'Chicken Wrap', price: P, desc: '', image: '/images/items/chicken-wrap.webp' },

  // ---------------------------------------------------------- Burger Meals
  { id: 'bm1',  category: 'Burger Meals', title: '1/4 Cheese Burger Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/1-4-cheese-burger-meal.webp', options: burgerMealOptions },
  { id: 'bm2',  category: 'Burger Meals', title: 'Cod Burger Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/cod-burger-meal.webp', options: burgerMealOptions },
  { id: 'bm3',  category: 'Burger Meals', title: 'Fillet Burger Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/fillet-burger-meal.webp', options: burgerMealOptions },
  { id: 'bm4',  category: 'Burger Meals', title: 'Tower Burger Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/tower-burger-meal.webp', options: burgerMealOptions },
  { id: 'bm5',  category: 'Burger Meals', title: 'Veggi Burger Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/veggi-burger-meal.webp', options: burgerMealOptions },
  { id: 'bm6',  category: 'Burger Meals', title: 'Chicken Dinner', price: P, desc: '', image: '/images/items/chicken-dinner.webp', options: mealOptions },
  { id: 'bm7',  category: 'Burger Meals', title: 'Chicken Nugget Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/chicken-nugget-meal.webp', options: mealOptions },
  { id: 'bm8',  category: 'Burger Meals', title: 'Chicken Popcorn Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/chicken-popcorn-meal.webp', options: mealOptions },
  { id: 'bm9',  category: 'Burger Meals', title: 'Chicken Strip Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/chicken-strip-meal.webp', options: mealOptions },
  { id: 'bm10', category: 'Burger Meals', title: 'Spicy Dipper Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/spicy-dipper-meal.webp', options: mealOptions },
  { id: 'bm11', category: 'Burger Meals', title: 'Variety Meal', price: P, desc: '', image: '/images/items/variety-meal.webp', options: mealOptions },
  { id: 'bm12', category: 'Burger Meals', title: 'Chicken Wrap Meal', price: P, desc: 'Served with chips and a drink', image: '/images/items/chicken-wrap-meal.webp', options: mealOptions },

  // ----------------------------------------------------------- Main Items
  { id: 'mi1', category: 'Main Items', title: '1 Pc Chicken', price: P, desc: '', image: '/images/items/1-pc-chicken.webp' },
  { id: 'mi2', category: 'Main Items', title: '2 Pcs Chicken', price: P, desc: '', image: '/images/items/2-pcs-chicken.webp' },
  { id: 'mi3', category: 'Main Items', title: '3 Pcs Chicken', price: P, desc: '', image: '/images/items/3-pcs-chicken.webp' },
  { id: 'mi4', category: 'Main Items', title: '6 Pcs Chicken', price: P, desc: '', image: '/images/items/6-pcs-chicken.webp' },
  { id: 'mi5', category: 'Main Items', title: '8 Pcs Chicken', price: P, desc: '', image: '/images/items/8-pcs-chicken.webp' },
  { id: 'mi6', category: 'Main Items', title: '12 Pcs Chicken', price: P, desc: '', image: '/images/items/12-pcs-chicken.webp' },

  { id: 'mi7',  category: 'Main Items', title: 'Chicken Fillet', price: P, desc: '', image: '/images/items/chicken-fillet.webp' },
  { id: 'mi8',  category: 'Main Items', title: 'Chicken Strips', price: P, desc: '', image: '/images/items/chicken-strips.webp' },
  { id: 'mi9',  category: 'Main Items', title: 'Chicken Nuggets', price: P, desc: '', image: '/images/items/chicken-nuggets.webp' },
  { id: 'mi10', category: 'Main Items', title: 'Chicken Popcorn', price: P, desc: '', image: '/images/items/chicken-popcorn.webp' },
  { id: 'mi11', category: 'Main Items', title: 'Hot Wings', price: P, desc: '', image: '/images/items/hot-wings.webp' },
  { id: 'mi12', category: 'Main Items', title: 'Hot & Spicy Wings', price: P, desc: '', image: '/images/items/hot-spicy-wings.webp' },
  { id: 'mi13', category: 'Main Items', title: 'Hot & Spicy Dippers', price: P, desc: '', image: '/images/items/hot-spicy-dippers.webp' },
  { id: 'mi14', category: 'Main Items', title: 'Spicy Dippers', price: P, desc: '', image: '/images/items/spicy-dippers.webp' },

  { id: 'mi15', category: 'Main Items', title: 'Cod Fillet Burger', price: P, desc: '', image: '/images/items/cod-fillet-burger.webp' },
  { id: 'mi16', category: 'Main Items', title: 'Veggi Burger', price: P, desc: '', image: '/images/items/veggi-burger.webp' },
  { id: 'mi17', category: 'Main Items', title: 'Chicken Wrap', price: P, desc: '', image: '/images/items/chicken-wrap.webp' },

  // ----------------------------------------------------------------- Pizza
  { id: 'pz1',  category: 'Pizza', title: 'Margarita', price: P, desc: 'Cheese and tomato', image: '/images/items/margarita.webp', options: pizzaOptions },
  { id: 'pz2',  category: 'Pizza', title: 'Pepperoni', price: P, desc: '', image: '/images/items/pepperoni.webp', options: pizzaOptions },
  { id: 'pz3',  category: 'Pizza', title: 'Romana', price: P, desc: '', image: '/images/items/romana.webp', options: pizzaOptions },
  { id: 'pz4',  category: 'Pizza', title: 'Vegetarian', price: P, desc: '', image: '/images/items/vegetarian.webp', options: pizzaOptions },
  { id: 'pz5',  category: 'Pizza', title: 'Vegetarian Hot', price: P, desc: '', image: '/images/items/vegetarian-hot.webp', options: pizzaOptions },
  { id: 'pz6',  category: 'Pizza', title: 'Chicken Feast', price: P, desc: '', image: '/images/items/chicken-feast.webp', options: pizzaOptions },
  { id: 'pz7',  category: 'Pizza', title: 'Flaming Chicken', price: P, desc: '', image: '/images/items/flaming-chicken.webp', options: pizzaOptions },
  { id: 'pz8',  category: 'Pizza', title: 'Hawaiian', price: P, desc: '', image: '/images/items/hawaiian.webp', options: pizzaOptions },
  { id: 'pz9',  category: 'Pizza', title: 'Hot & Spicy', price: P, desc: '', image: '/images/items/hot-spicy.webp', options: pizzaOptions },
  { id: 'pz10', category: 'Pizza', title: 'Meat Feast', price: P, desc: '', image: '/images/items/meat-feast.webp', options: pizzaOptions },
  { id: 'pz11', category: 'Pizza', title: 'BBQ Chicken', price: P, desc: '', image: '/images/items/bbq-chicken.webp', options: pizzaOptions },
  { id: 'pz12', category: 'Pizza', title: 'Sea Food Tuna', price: P, desc: '', image: '/images/items/sea-food-tuna.webp', options: pizzaOptions },
  { id: 'pz13', category: 'Pizza', title: 'American Special', price: P, desc: '', image: '/images/items/american-special.webp', options: pizzaOptions },
  { id: 'pz14', category: 'Pizza', title: 'Create Your Own', price: P, desc: 'Choose your own toppings', image: '/images/items/create-your-own.webp', options: pizzaOptions },

  // ---------------------------------------------------------- Garlic Bread
  { id: 'gb1', category: 'Garlic Bread', title: 'Garlic Bread', price: P, desc: '', image: '/images/items/garlic-bread.webp' },
  { id: 'gb2', category: 'Garlic Bread', title: 'Cheese Garlic Bread', price: P, desc: '', image: '/images/items/cheese-garlic-bread.webp' },
  { id: 'gb3', category: 'Garlic Bread', title: 'Tomato Garlic Bread', price: P, desc: '', image: '/images/items/tomato-garlic-bread.webp' },

  // -------------------------------------------------------------- Starters
  { id: 'st1',  category: 'Starters', title: '3 Hot & Spicy Wings', price: P, desc: '', image: '/images/items/3-hot-spicy-wings.webp' },
  { id: 'st2',  category: 'Starters', title: '5 Hot & Spicy Wings', price: P, desc: '', image: '/images/items/5-hot-spicy-wings.webp' },
  { id: 'st3',  category: 'Starters', title: '10 Hot & Spicy Wings', price: P, desc: '', image: '/images/items/10-hot-spicy-wings.webp' },
  { id: 'st4',  category: 'Starters', title: '4 Hot & Spicy Dippers', price: P, desc: '', image: '/images/items/4-hot-spicy-dippers.webp' },
  { id: 'st5',  category: 'Starters', title: '4 Chicken Strips', price: P, desc: '', image: '/images/items/4-chicken-strips.webp' },
  { id: 'st6',  category: 'Starters', title: '4 Hash Browns', price: P, desc: '', image: '/images/items/4-hash-browns.webp' },
  { id: 'st7',  category: 'Starters', title: '6 Chicken Nuggets', price: P, desc: '', image: '/images/items/6-chicken-nuggets.webp' },
  { id: 'st8',  category: 'Starters', title: '12 Chicken Nuggets', price: P, desc: '', image: '/images/items/12-chicken-nuggets.webp' },
  { id: 'st9',  category: 'Starters', title: '20 Chicken Nuggets', price: P, desc: '', image: '/images/items/20-chicken-nuggets.webp' },
  { id: 'st10', category: 'Starters', title: '12 Onion Rings', price: P, desc: '', image: '/images/items/12-onion-rings.webp' },
  { id: 'st11', category: 'Starters', title: 'Reg Chicken Popcorn', price: P, desc: '', image: '/images/items/reg-chicken-popcorn.webp' },
  { id: 'st12', category: 'Starters', title: 'Large Chicken Popcorn', price: P, desc: '', image: '/images/items/large-chicken-popcorn.webp' },
  { id: 'st13', category: 'Starters', title: '12 Garlic Mushrooms + Dip', price: P, desc: 'Served with a dip', image: '/images/items/12-garlic-mushrooms-dip.webp', options: dipChoices },
  { id: 'st14', category: 'Starters', title: 'Potato Wedges + Dip', price: P, desc: 'Served with a dip', image: '/images/items/potato-wedges-dip.webp', options: dipChoices },
  { id: 'st15', category: 'Starters', title: 'Chilli Cheese Bites (6)', price: P, desc: '', image: '/images/items/chilli-cheese-bites-6.webp' },

  // --------------------------------------------------------- Family Treats
  { id: 'ft1',  category: 'Family Treats', title: 'Boneless Bucket', price: P, desc: '', image: '/images/items/boneless-bucket.webp' },
  { id: 'ft2',  category: 'Family Treats', title: 'Family Feast Meal', price: P, desc: '', image: '/images/items/family-feast-meal.webp' },
  { id: 'ft3',  category: 'Family Treats', title: 'Family Value Meal', price: P, desc: '', image: '/images/items/family-value-meal.webp' },
  { id: 'ft4',  category: 'Family Treats', title: 'Bargain Bucket', price: P, desc: '', image: '/images/items/bargain-buckets.webp' },
  { id: 'ft5',  category: 'Family Treats', title: 'Variety Bucket', price: P, desc: '', image: '/images/items/variety-bucket.webp' },
  { id: 'ft6',  category: 'Family Treats', title: 'Party Meal', price: P, desc: '', image: '/images/items/party-meal.webp' },
  { id: 'ft7',  category: 'Family Treats', title: 'Family Box', price: P, desc: '', image: '/images/items/family-box.webp' },
  { id: 'ft8',  category: 'Family Treats', title: 'Full House', price: P, desc: '', image: '/images/items/full-house.webp' },
  { id: 'ft9',  category: 'Family Treats', title: 'Box Meal', price: P, desc: '', image: '/images/items/box-meal.webp' },
  { id: 'ft10', category: 'Family Treats', title: 'Boneless Meal', price: P, desc: '', image: '/images/items/boneless-meal.webp' },
  { id: 'ft11', category: 'Family Treats', title: 'Hot Wings Meal', price: P, desc: '', image: '/images/items/hot-wings-meal.webp' },

  // ----------------------------------------------------------------- Sides
  { id: 'sd1',  category: 'Sides', title: 'Chips', price: P, desc: '', image: '/images/items/chips.webp' },
  { id: 'sd2',  category: 'Sides', title: 'Chicken Gravy', price: P, desc: '', image: '/images/items/chicken-gravy.webp' },
  { id: 'sd3',  category: 'Sides', title: 'BBQ Beans', price: P, desc: '', image: '/images/items/bbq-beans.webp' },
  { id: 'sd4',  category: 'Sides', title: 'Coleslaw', price: P, desc: '', image: '/images/items/coleslaw.webp' },
  { id: 'sd5',  category: 'Sides', title: 'Corn Cobbettes (2)', price: P, desc: '', image: '/images/items/corn-cobbettes-2.webp' },
  { id: 'sd6',  category: 'Sides', title: 'Cheese Slice', price: P, desc: '', image: '/images/items/cheese-slice.webp' },
  { id: 'sd7',  category: 'Sides', title: 'Red Salt', price: P, desc: '', image: '/images/items/red-salt.webp' },
  { id: 'sd8',  category: 'Sides', title: 'Mayo Dip', price: P, desc: '', image: '/images/items/mayo-dip.webp' },
  { id: 'sd9',  category: 'Sides', title: 'Garlic Mayo Dip', price: P, desc: '', image: '/images/items/mayo-dip.webp' },
  { id: 'sd10', category: 'Sides', title: 'BBQ Sauce', price: P, desc: '', image: '/images/items/bbq-sauce.webp' },
  { id: 'sd11', category: 'Sides', title: 'Ketchup', price: P, desc: '', image: '/images/items/ketchup.webp' },
  { id: 'sd12', category: 'Sides', title: 'Chilli Sauce', price: P, desc: '', image: '/images/items/chilli-sauce.webp' },

  // -------------------------------------------------------------- Desserts
  { id: 'ds1', category: 'Desserts', title: 'Hot Apple Pie', price: P, desc: '', image: '/images/items/hot-apple-pie.webp' },
  { id: 'ds2', category: 'Desserts', title: 'Chocolate Doughnut', price: P, desc: '', image: '/images/items/chocolate-doughnut.webp' },
  { id: 'ds3', category: 'Desserts', title: 'Chocolate Fudge Cake', price: P, desc: '', image: '/images/items/chocolate-fudge-cake.webp' },
  { id: 'ds4', category: 'Desserts', title: 'Chocolate Cheese Cake', price: P, desc: '', image: '/images/items/chocolate-cheese-cake.webp' },
  { id: 'ds5', category: 'Desserts', title: 'Strawberry Cheese Cake', price: P, desc: '', image: '/images/items/strawberry-cheese-cake.webp' },
  { id: 'ds6', category: 'Desserts', title: "Ben & Jerry's (100ml)", price: P, desc: '', image: ph.desserts },
  { id: 'ds7', category: 'Desserts', title: "Ben & Jerry's (500ml)", price: P, desc: '', image: ph.desserts },
];

// Shown in the "Chef's picks" rail on the order page.
export const recommendedItems = [
  { id: 'bm4',  title: 'Tower Burger Meal', price: P },
  { id: 'ft2',  title: 'Family Feast Meal', price: P },
  { id: 'bg2',  title: 'Zinger Fillet Burger', price: P },
  { id: 'pz10', title: 'Meat Feast', price: P },
  { id: 'st3',  title: '10 Hot & Spicy Wings', price: P },
];
