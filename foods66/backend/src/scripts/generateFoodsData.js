import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate slug
const getSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Helper to determine if a food is vegetarian
const isFoodVeg = (category, name) => {
  if (category === 'Veg' || category === 'Ice Creams & Dessert' || category === 'Coffee') return true;
  if (category === 'Drinks') {
    return true;
  }
  if (category === 'Non-Veg') return false;
  
  const lower = name.toLowerCase();
  const nonVegKeywords = ['chicken', 'mutton', 'lamb', 'beef', 'fish', 'prawn', 'shrimp', 'crab', 'squid', 'egg', 'pork', 'tuna', 'salmon', 'tilapia', 'meat', 'seafood', 'bacon', 'turkey', 'halibut', 'bass', 'calamari', 'pomfret'];
  for (const kw of nonVegKeywords) {
    if (lower.includes(kw)) return false;
  }
  return true;
};

// ── COMMON MENU FOODS (560 items) ─────────────────────────────────

const COMMON_VEG = [
  // South Indian Dosas & Crepes (30)
  { name: 'Masala Dosa', price: 80, desc: 'Crispy fermented rice crepe filled with spiced potato masala and served with chutneys.' },
  { name: 'Ghee Roast Dosa', price: 100, desc: 'Golden crispy dosa roasted with pure aromatic desi ghee, served with sambar.' },
  { name: 'Plain Dosa', price: 65, desc: 'Thin and crispy golden crepe made from fermented batter, served with 3 chutneys.' },
  { name: 'Onion Rava Dosa', price: 95, desc: 'Crisp semolina crepe studded with onions, green chillies, and crushed black peppercorns.' },
  { name: 'Mysore Masala Dosa', price: 110, desc: 'Crispy dosa coated with fiery red garlic-chili paste and filled with potato masala.' },
  { name: 'Paper Masala Dosa', price: 120, desc: 'Ultra-thin, extra crispy elongated dosa served with signature potato masala.' },
  { name: 'Set Dosa', price: 90, desc: 'Trio of soft, fluffy, melt-in-mouth spongy dosas served with creamy coconut chutney and sagu.' },
  { name: 'Cheese Burst Dosa', price: 140, desc: 'Fusion dosa loaded with melted mozzarella, cheddar, and spiced vegetables.' },
  { name: 'Paneer Masala Dosa', price: 130, desc: 'Crispy dosa packed with grated cottage cheese sauteed in aromatic spices.' },
  { name: 'Podi Dosa', price: 95, desc: 'Crisp dosa generously smeared with fiery gun powder (idli podi) and hot sesame oil.' },
  { name: 'Schezwan Dosa', price: 115, desc: 'Indo-Chinese fusion crepe tossed with spicy schezwan sauce and crispy shredded vegetables.' },
  { name: 'Spring Roll Dosa', price: 125, desc: 'Crispy rolled dosa stuffed with crunchy cabbage, capsicum, carrots, and soy sauce.' },
  { name: 'Chocolate Dosa', price: 110, desc: 'Sweet dessert dosa spread with rich Nutella and dark chocolate sauce.' },
  { name: 'Mushroom Masala Dosa', price: 135, desc: 'Dosa packed with tender mushrooms cooked in caramelized onions and spices.' },
  { name: 'Palak Dosa', price: 105, desc: 'Vibrant green spinach puree enriched dosa served with tomato and coconut chutneys.' },
  { name: 'Tomato Onion Uttapam', price: 95, desc: 'Thick savory pancake topped with juicy tomatoes, crunchy onions, and fresh coriander.' },
  { name: 'Mixed Veg Uttapam', price: 100, desc: 'Thick fermented rice pancake loaded with grated carrots, bell peppers, tomatoes, and peas.' },
  { name: 'Coconut Rava Dosa', price: 105, desc: 'Lacy semolina dosa sprinkled with freshly grated coconut and tempered mustard.' },
  { name: 'Garlic Roast Dosa', price: 100, desc: 'Aromatic dosa roasted in golden garlic butter, served with piquant sambar.' },
  { name: 'Butter Plain Dosa', price: 85, desc: 'Classic golden dosa layered with a generous dollop of butter.' },
  { name: 'Kal Dosa with Kurma', price: 90, desc: 'Traditional thick and soft griddle-cooked pancake served with spiced vegetable kurma.' },
  { name: 'Pesarattu with Upma', price: 110, desc: 'Andhra green gram whole lentil dosa stuffed with steaming hot semolina upma.' },
  { name: 'Neer Dosa with Chutney', price: 95, desc: 'Delicate, lacy Karnataka rice crepes served with coconut-jaggery and spicy chutney.' },
  { name: 'Davangere Benne Dosa', price: 120, desc: 'Famous Karnataka butter dosa with a crisp exterior and fluffy, buttery interior.' },
  { name: 'Appam with Coconut Milk', price: 85, desc: 'Bowl-shaped fermented rice hoppers with soft spongy centers and lacy crisp borders.' },
  { name: 'Ragi Onion Dosa', price: 90, desc: 'Nutritious finger millet dosa tempered with onions, green chillies, and curry leaves.' },
  { name: 'Wheat Dosa', price: 75, desc: 'Instant whole wheat flour savory crepe served with tangy tomato chutney.' },
  { name: 'Spinach Cheese Dosa', price: 130, desc: 'Healthful spinach puree base with gooey melted cheese.' },
  { name: 'Corn Capsicum Dosa', price: 115, desc: 'Sweet corn kernels and crunchy green capsicum tossed in mild tawa spices.' },
  { name: 'Guntur Karam Dosa', price: 105, desc: 'Fiery Andhra style dosa roasted with red chili paste and melted ghee.' },

  // South Indian Idli, Vada, Upma & Tiffin (30)
  { name: 'Plain Idli', price: 50, desc: 'Pair of pillowy soft steamed rice and urad dal cakes served with sambar and coconut chutney.' },
  { name: 'Mini Ghee Sambar Idli', price: 75, desc: 'Bowl of fourteen button idlis immersed in piping hot sambar and drizzled with ghee.' },
  { name: 'Kanchipuram Idli', price: 80, desc: 'Traditional spiced steamed rice cake seasoned with cumin, pepper, ginger, and curry leaves.' },
  { name: 'Thatte Idli', price: 65, desc: 'Large plate-sized steamed idli topped with spicy podi and melting butter.' },
  { name: 'Fried Podi Idli', price: 85, desc: 'Crispy tossed idli cubes coated with fiery gunpowder and ghee.' },
  { name: 'Button Idli with Coconut Chutney', price: 70, desc: 'Bite-sized delicate idlis accompanied by three regional coconut dips.' },
  { name: 'Rava Idli with Ghee', price: 75, desc: 'Steamed semolina cakes tempered with mustard, cashews, and grated carrots.' },
  { name: 'Medu Vada', price: 60, desc: 'Pair of golden, crisp lentil fritters with fluffy centers, served with sambar.' },
  { name: 'Sambar Vada', price: 75, desc: 'Crisp medu vadas dipped in aromatic hot tamarind-lentil broth.' },
  { name: 'Curd Vada (Dahi Vada)', price: 80, desc: 'Soft lentil dumplings soaked in chilled sweet yogurt, sprinkled with roasted cumin and boondi.' },
  { name: 'Masala Vada', price: 55, desc: 'Crunchy Bengal gram fritters flavored with fennel seeds, onions, and curry leaves.' },
  { name: 'Keerai Vada', price: 60, desc: 'Crispy lentil patties packed with iron-rich fresh amaranth and spinach greens.' },
  { name: 'Sabudana Vada', price: 70, desc: 'Crispy tapioca pearl patties blended with roasted peanuts and mashed potatoes.' },
  { name: 'Ven Pongal with Ghee', price: 70, desc: 'Comforting porridge of rice and moong dal tempered with black pepper, cumin, ginger, and cashews.' },
  { name: 'Rava Upma', price: 55, desc: 'Savory semolina porridge cooked with mustard seeds, curry leaves, and ginger.' },
  { name: 'Semiya Upma', price: 60, desc: 'Roasted vermicelli cooked with crunchy vegetables and south Indian tempering.' },
  { name: 'Tomato Bath', price: 70, desc: 'Fragrant spiced semolina and tomato preparation with roasted peanuts.' },
  { name: 'Bisi Bele Bath', price: 85, desc: 'Traditional Karnataka rice, dal, and vegetable medley with rich tamarind and spices.' },
  { name: 'Curd Rice with Pomegranate', price: 65, desc: 'Cooling rice tossed with fresh curd, mustard seeds, green chillies, and juicy pomegranate.' },
  { name: 'Lemon Rice with Peanuts', price: 65, desc: 'Tangy turmeric-infused rice tempered with mustard, curry leaves, and crunchy peanuts.' },
  { name: 'Tamarind Rice (Puliyodharai)', price: 70, desc: 'Traditional temple style tangy tamarind paste rice infused with aromatic spices.' },
  { name: 'Coconut Rice', price: 75, desc: 'Basmati rice cooked in coconut milk and freshly grated coconut with mild spices.' },
  { name: 'Coriander Rice', price: 70, desc: 'Zesty green rice made with fresh coriander paste, mint, and whole spices.' },
  { name: 'Mint Pulao', price: 80, desc: 'Aromatic pulao cooked with fresh garden mint leaves and whole spices.' },
  { name: 'South Indian Mini Thali', price: 120, desc: 'Platter with rice, sambar, rasam, kootu, poriyal, curd, papad, and sweet payasam.' },
  { name: 'Poori Masala', price: 80, desc: 'Three puffed golden wheat pooris served with spiced potato and onion bhaji.' },
  { name: 'Chola Poori with Chana Masala', price: 110, desc: 'Large fluffy bhature-style deep fried bread served with spicy chickpea gravy.' },
  { name: 'Kuzhi Paniyaram (Sweet)', price: 70, desc: 'Steamed and fried golden rice balls sweetened with jaggery and cardamom.' },
  { name: 'Kara Paniyaram (Spicy)', price: 70, desc: 'Crisp savory rice-lentil dumplings tempered with mustard, onions, and chillies.' },
  { name: 'Kozhukattai Steamed Dumplings', price: 65, desc: 'South Indian steamed rice flour dumplings filled with grated coconut and jaggery.' },

  // North Indian Curries & Gravies (40)
  { name: 'Paneer Butter Masala', price: 190, desc: 'Tender cottage cheese cubes simmered in a luscious tomato-cashew-butter cream sauce.' },
  { name: 'Palak Paneer', price: 180, desc: 'Cottage cheese cubes bathed in smooth, garlicky pureed spinach.' },
  { name: 'Shahi Paneer', price: 200, desc: 'Royal Mughlai preparation of paneer in a creamy white almond-cashew gravy with saffron.' },
  { name: 'Kadai Paneer', price: 190, desc: 'Paneer chunks, crunchy bell peppers, and onions tossed with freshly ground coriander and red chillies.' },
  { name: 'Matar Paneer', price: 170, desc: 'Classic North Indian curry combining soft paneer and sweet green peas in spiced onion-tomato gravy.' },
  { name: 'Paneer Tikka Masala', price: 210, desc: 'Charcoal grilled paneer cubes cooked in a spiced, smoky tomato-onion gravy.' },
  { name: 'Malai Kofta', price: 200, desc: 'Melt-in-mouth cottage cheese and potato dumplings in sweet and savory cashew cream sauce.' },
  { name: 'Dal Makhani', price: 160, desc: 'Whole black lentils and kidney beans slow-simmered overnight with butter, cream, and garlic.' },
  { name: 'Dal Tadka', price: 130, desc: 'Yellow toor dal tempered with sizzling ghee, cumin seeds, garlic, and dry red chillies.' },
  { name: 'Yellow Dal Fry', price: 120, desc: 'Homestyle yellow lentils cooked with onions, tomatoes, ginger, and fresh cilantro.' },
  { name: 'Chana Masala', price: 140, desc: 'Plump chickpeas simmered in an aromatic blend of pomegranate seeds, amchur, and garam masala.' },
  { name: 'Rajma Masala', price: 140, desc: 'Red kidney beans slow cooked in a rich, spicy onion-tomato masala.' },
  { name: 'Aloo Gobi Masala', price: 130, desc: 'Dry roasted potatoes and cauliflower florets seasoned with turmeric, ginger, and cumin.' },
  { name: 'Dum Aloo Kashmiri', price: 160, desc: 'Baby potatoes slow-cooked under steam in yogurt-based fennel and ginger gravy.' },
  { name: 'Bhindi Do Pyaza', price: 140, desc: 'Tender okra sauteed with double the quantity of caramelized onions and spices.' },
  { name: 'Baingan Bharta', price: 150, desc: 'Charcoal-roasted eggplant mashed and tempered with mustard oil, onions, tomatoes, and peas.' },
  { name: 'Mix Vegetable Handi', price: 160, desc: 'Assorted seasonal vegetables cooked in an earthen clay pot with rich whole spices.' },
  { name: 'Methi Matar Malai', price: 180, desc: 'Bitter-sweet fenugreek leaves and tender green peas in smooth cashew cream.' },
  { name: 'Navratan Korma', price: 190, desc: 'Nine gems medley of vegetables, dry fruits, and paneer in fragrant mild almond gravy.' },
  { name: 'Mushroom Do Pyaza', price: 170, desc: 'Button mushrooms and crisp onion petals cooked in savory spiced gravy.' },
  { name: 'Paneer Lababdar', price: 200, desc: 'Grated and cubed paneer cooked in a rich, tangy onion-tomato-cashew gravy with kasuri methi.' },
  { name: 'Paneer Pasanda', price: 210, desc: 'Paneer sandwiches stuffed with dry fruits and mint, cooked in rich Mughlai gravy.' },
  { name: 'Amritsari Chole', price: 150, desc: 'Dark, spicy Punjab-style chickpeas infused with black tea and whole spices.' },
  { name: 'Dal Panchmel', price: 140, desc: 'Rajasthani nutritious mix of five lentils slow-cooked with ghee and hing.' },
  { name: 'Soya Chaap Masala', price: 170, desc: 'Protein-rich soy ribs simmered in a robust tandoori-style onion-tomato sauce.' },
  { name: 'Tawa Chaap Gravy', price: 180, desc: 'Charred soya chaap tossed on an iron griddle with tomatoes, capsicum, and herbs.' },
  { name: 'Kadhai Mushroom', price: 160, desc: 'Button mushrooms sauteed with capsicum and freshly pounded kadhai masala.' },
  { name: 'Sarson Ka Saag', price: 170, desc: 'Traditional Punjabi mustard greens and bathua stew cooked with ginger and served with white butter.' },
  { name: 'Veg Jalfrezi', price: 150, desc: 'Stir-fried julienned vegetables and paneer in a tangy tomato-chili sauce.' },
  { name: 'Veg Kolhapuri', price: 160, desc: 'Fiery Maharashtrian vegetable curry prepared with toasted coconut, sesame, and red chillies.' },
  { name: 'Corn Palak Curry', price: 150, desc: 'Sweet golden corn kernels in velvety garlic-spinach gravy.' },
  { name: 'Veg Kadai', price: 150, desc: 'Mixed vegetables and capsicum stir-fried with roasted coriander seeds and dried red chillies.' },
  { name: 'Vegetable Makhanwala', price: 160, desc: 'Assorted seasonal vegetables cooked in a velvety tomato-butter reduction.' },
  { name: 'Aloo Jeera Dry', price: 110, desc: 'Boiled potato cubes tossed with roasted cumin seeds, turmeric, and dry mango powder.' },
  { name: 'Kashmiri Dum Aloo', price: 160, desc: 'Fried baby potatoes simmered in spicy yogurt gravy flavored with dry ginger and saunf.' },
  { name: 'Veg Handi Lazeez', price: 170, desc: 'Clay pot vegetable preparation with creamy tomato gravy and aromatic cardamom.' },
  { name: 'Paneer Do Pyaza', price: 190, desc: 'Cottage cheese cooked with layered sautéed onions and whole spices.' },
  { name: 'Dal Palak', price: 130, desc: 'Yellow moong dal cooked with fresh chopped spinach and tempered with garlic and cumin.' },
  { name: 'Paneer Bhurji Gravy', price: 180, desc: 'Crumbled cottage cheese cooked with tomatoes, green chillies, onions, and butter.' },
  { name: 'Gobi Matar Rassa', price: 130, desc: 'Spiced homestyle cauliflower and pea curry in thin flavorful tomato gravy.' },

  // Breads, Rotis, Naans & Parathas (30)
  { name: 'Butter Naan', price: 50, desc: 'Classic leavened flatbread baked on tandoor clay walls and brushed with melted butter.' },
  { name: 'Garlic Naan', price: 60, desc: 'Tandoor baked naan topped with roasted minced garlic, coriander, and butter.' },
  { name: 'Cheese Garlic Naan', price: 90, desc: 'Leavened bread stuffed with melted cheese and coated with roasted garlic.' },
  { name: 'Tandoori Roti', price: 25, desc: 'Whole wheat flatbread baked inside a fiery clay tandoor oven.' },
  { name: 'Butter Roti', price: 30, desc: 'Tandoor cooked whole wheat roti brushed with pure salted butter.' },
  { name: 'Laccha Paratha', price: 50, desc: 'Multi-layered flaky whole wheat bread cooked on an iron tawa with ghee.' },
  { name: 'Pudina Paratha', price: 55, desc: 'Flaky layered bread dusted with dried mint leaves, ajwain, and clarified butter.' },
  { name: 'Stuffed Aloo Paratha', price: 90, desc: 'Golden whole wheat flatbread stuffed with spiced mashed potatoes, served with pickle.' },
  { name: 'Paneer Paratha', price: 110, desc: 'Crisp paratha filled with grated cottage cheese, green chillies, and coriander.' },
  { name: 'Gobi Paratha', price: 90, desc: 'Whole wheat bread stuffed with grated spiced cauliflower and roasted cumin.' },
  { name: 'Onion Paratha', price: 85, desc: 'Crisp griddled flatbread stuffed with chopped spiced red onions.' },
  { name: 'Methi Thepla (4 pcs)', price: 80, desc: 'Gujarati thin flatbreads flavored with fresh fenugreek, yogurt, and sesame seeds.' },
  { name: 'Missi Roti', price: 45, desc: 'Nutritious flatbread made from gram flour, whole wheat, kasuri methi, and onions.' },
  { name: 'Roomali Roti', price: 40, desc: 'Handkerchief-thin soft unleavened bread tossed and baked over an inverted wok.' },
  { name: 'Makki Ki Roti', price: 45, desc: 'Traditional Punjabi unleavened cornmeal flatbread served with dollops of white butter.' },
  { name: 'Bhatura (2 pcs)', price: 70, desc: 'Fluffy, golden, puffed deep-fried leavened bread ideal for chana masala.' },
  { name: 'Amritsari Kulcha with Chole', price: 140, desc: 'Crispy layered tandoori bread stuffed with spiced potato and onion, served with chole.' },
  { name: 'Onion Kulcha', price: 65, desc: 'Leavened soft flatbread stuffed with finely chopped onions and pomegranate seeds.' },
  { name: 'Paneer Kulcha', price: 80, desc: 'Soft tandoori kulcha packed with seasoned crumbled cottage cheese.' },
  { name: 'Pudina Naan', price: 55, desc: 'Tandoor baked naan topped with crushed mint and butter.' },
  { name: 'Kashmiri Naan with Dry Fruits', price: 95, desc: 'Sweet leavened bread stuffed with crushed cherries, raisins, cashews, and almonds.' },
  { name: 'Multi-Grain Roti (3 pcs)', price: 60, desc: 'Healthy flatbread made from wheat, oats, ragi, and soy flour.' },
  { name: 'Bajra Roti with Ghee', price: 45, desc: 'Pearl millet flatbread roasted on open flame and brushed with desi ghee.' },
  { name: 'Jowar Bhakri', price: 45, desc: 'Gluten-free sorghum flatbread patted by hand and roasted on iron griddle.' },
  { name: 'Chapati Set (3 pcs)', price: 40, desc: 'Homestyle soft puffed whole wheat phulkas prepared without oil.' },
  { name: 'Ajwain Paratha', price: 45, desc: 'Crispy triangle layered flatbread flavored with digestive carom seeds.' },
  { name: 'Mughlai Paratha Veg', price: 100, desc: 'Crisp shallow-fried pastry stuffed with spiced cottage cheese and minced vegetables.' },
  { name: 'Cheese Naan with Herbs', price: 95, desc: 'Stuffed naan with melted mozzarella and fresh Italian oregano.' },
  { name: 'Butter Kulcha', price: 50, desc: 'Soft leavened tandoor bread brushed with melted butter.' },
  { name: 'Chili Garlic Naan', price: 70, desc: 'Spicy naan topped with minced green chillies, garlic flakes, and butter.' },

  // Rice, Biryani & Khichdi (Veg) (30)
  { name: 'Veg Dum Biryani', price: 140, desc: 'Fragrant basmati rice layered with garden vegetables, saffron milk, and fried onions.' },
  { name: 'Hyderabadi Veg Biryani', price: 160, desc: 'Spicy Nizam-style vegetable biryani cooked under slow steam with mint and coriander.' },
  { name: 'Paneer Biryani', price: 180, desc: 'Marinated paneer cubes layered with aromatic basmati rice and whole spices.' },
  { name: 'Mushroom Biryani', price: 170, desc: 'Juicy button mushrooms infused with biryani spices, layered with saffron rice.' },
  { name: 'Soya Chaap Biryani', price: 170, desc: 'Tender tandoori soya chaap layered with spicy basmati rice and caramelized onions.' },
  { name: 'Awadhi Veg Biryani', price: 165, desc: 'Subtle Lucknowi style vegetable biryani infused with kewra water and green cardamom.' },
  { name: 'Jeera Rice', price: 90, desc: 'Fragrant basmati rice tempered with toasted cumin seeds and clarified butter.' },
  { name: 'Ghee Rice', price: 110, desc: 'Aromatic rice roasted in pure ghee with cashews, raisins, and cinnamon.' },
  { name: 'Peas Pulao', price: 100, desc: 'Mild basmati rice preparation cooked with sweet green peas and whole spices.' },
  { name: 'Kashmiri Pulao', price: 140, desc: 'Saffron-infused rice loaded with dry fruits, fried cashews, and fresh fruits.' },
  { name: 'Navratan Pulao', price: 140, desc: 'Royal nine-gem rice dish enriched with paneer, vegetables, and roasted dry fruits.' },
  { name: 'Veg Fried Rice', price: 120, desc: 'Wok-tossed rice with finely chopped carrots, beans, cabbage, and spring onions.' },
  { name: 'Schezwan Veg Fried Rice', price: 130, desc: 'Spicy wok-tossed fried rice seasoned with fiery Schezwan chili paste.' },
  { name: 'Burnt Garlic Fried Rice', price: 130, desc: 'Fragrant fried rice loaded with crispy golden roasted garlic flakes.' },
  { name: 'Moong Dal Khichdi', price: 110, desc: 'Comforting preparation of rice and yellow moong dal tempered with ghee and cumin.' },
  { name: 'Masala Vegetable Khichdi', price: 120, desc: 'Wholesome rice and lentil porridge cooked with seasonal vegetables and mild spices.' },
  { name: 'Palak Khichdi', price: 125, desc: 'Nutritious green khichdi blended with pureed spinach and tempered with garlic.' },
  { name: 'Bajra Moong Khichdi', price: 120, desc: 'Hearty pearl millet and split green gram khichdi served with a dollop of ghee.' },
  { name: 'Panchratna Khichdi', price: 130, desc: 'Five-grain and multi-lentil wholesome khichdi with roasted cumin.' },
  { name: 'Sweet Corn Fried Rice', price: 125, desc: 'Wok tossed basmati rice with sweet corn, scallions, and white pepper.' },
  { name: 'Mushroom Fried Rice', price: 140, desc: 'Sautéed mushrooms, spring onions, and garlic tossed with long grain rice.' },
  { name: 'Paneer Fried Rice', price: 150, desc: 'Golden paneer cubes and crunchy vegetables tossed in a smoking hot wok.' },
  { name: 'Mexican Rice Bowl (Veg)', price: 160, desc: 'Spiced tomato rice topped with black beans, corn, salsa, and guacamole.' },
  { name: 'Veg Pulao with Raita', price: 120, desc: 'Home-style vegetable rice cooked with bay leaves, served with boondi raita.' },
  { name: 'Biryani Rice with Salan', price: 100, desc: 'Flavored biryani rice served with tangy Hyderabad mirchi ka salan.' },
  { name: 'Steamed Basmati Rice', price: 70, desc: 'Fluffy long-grain aromatic steamed basmati rice.' },
  { name: 'Saffron Rice', price: 110, desc: 'Basmati rice infused with pure Kashmiri saffron strands and cardamoms.' },
  { name: 'Brown Rice Veg Pulao', price: 130, desc: 'Fiber-rich unpolished brown rice cooked with seasonal vegetables and spices.' },
  { name: 'Curd Rice Tadka', price: 80, desc: 'South Indian tempered curd rice with mustard, ginger, curry leaves, and urad dal.' },
  { name: 'Lemon Turmeric Rice', price: 75, desc: 'Bright yellow tempered rice with crunchy peanuts, curry leaves, and lemon juice.' },

  // Indo-Chinese & Street Chaat (Veg) (30)
  { name: 'Veg Hakka Noodles', price: 120, desc: 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, and light soy sauce.' },
  { name: 'Schezwan Veg Noodles', price: 130, desc: 'Fiery noodles tossed in house-made Schezwan chili oil and crunchy scallions.' },
  { name: 'Chili Garlic Noodles', price: 130, desc: 'Spicy noodles bursting with pungent minced garlic, red chillies, and spring onions.' },
  { name: 'Veg Manchurian Dry', price: 140, desc: 'Crispy minced vegetable balls tossed in dark soy sauce, ginger, garlic, and green chillies.' },
  { name: 'Veg Manchurian Gravy', price: 150, desc: 'Vegetable dumplings in a glossy, flavorful garlic-soy gravy.' },
  { name: 'Gobi Manchurian Dry', price: 130, desc: 'Crispy battered cauliflower florets tossed in sweet and spicy chili-garlic glaze.' },
  { name: 'Gobi Manchurian Gravy', price: 140, desc: 'Golden cauliflower florets bathed in savory Indo-Chinese Manchurian sauce.' },
  { name: 'Crispy Baby Corn Chili', price: 150, desc: 'Crunchy baby corn tossed with capsicum, onions, and spicy dark soy sauce.' },
  { name: 'Chili Paneer Dry', price: 170, desc: 'Batter-fried paneer cubes wok-tossed with green chillies, garlic, and spring onions.' },
  { name: 'Chili Paneer Gravy', price: 180, desc: 'Soft paneer cubes in thick savory Indo-Chinese chili sauce.' },
  { name: 'Honey Chili Potato', price: 130, desc: 'Crispy fried potato fingers tossed in spicy chili paste and drizzled with honey.' },
  { name: 'Crispy Lotus Stem', price: 160, desc: 'Thin slices of lotus stem fried crisp and coated in sweet chili garlic glaze.' },
  { name: 'Spring Rolls (Veg)', price: 110, desc: 'Crisp fried rolls filled with seasoned shredded vegetables, served with sweet chili dip.' },
  { name: 'Steamed Veg Momos', price: 90, desc: 'Six delicate steamed dumplings stuffed with finely minced vegetables, served with spicy red chutney.' },
  { name: 'Fried Veg Momos', price: 100, desc: 'Crispy golden fried momos with juicy vegetable filling.' },
  { name: 'Pan-Fried Schezwan Momos', price: 115, desc: 'Momos pan-tossed in a hot and spicy Schezwan sauce with peppers.' },
  { name: 'Pav Bhaji', price: 120, desc: 'Mashed spiced vegetable curry cooked on iron tawa with butter, served with two soft pavs.' },
  { name: 'Cheese Pav Bhaji', price: 140, desc: 'Classic spiced vegetable bhaji topped with a mountain of grated cheddar cheese.' },
  { name: 'Pani Puri', price: 50, desc: 'Six crispy hollow puris filled with spiced potato-chickpea mash, sweet tamarind water, and spicy mint water.' },
  { name: 'Sev Puri', price: 60, desc: 'Flat crispy puris topped with potatoes, onions, three chutneys, and crunchy sev.' },
  { name: 'Dahi Puri', price: 70, desc: 'Crisp puris stuffed with potato mash, cool sweet yogurt, chutneys, and sev.' },
  { name: 'Bhel Puri', price: 55, desc: 'Puffed rice tossed with onions, tomatoes, raw mango, spicy and sweet chutneys, and sev.' },
  { name: 'Samosa Chaat', price: 75, desc: 'Crushed potato samosas topped with hot chana masala, chilled curd, chutneys, and spices.' },
  { name: 'Aloo Tikki Chaat', price: 70, desc: 'Crispy spiced potato patties topped with warm chickpea curry and tangy chutneys.' },
  { name: 'Papdi Chaat', price: 65, desc: 'Crispy wheat wafers layered with potatoes, chickpeas, yogurt, and tamarind chutney.' },
  { name: 'Raj Kachori', price: 95, desc: 'Grand crispy hollow kachori stuffed with sprouts, potatoes, yogurt, dry fruits, and chutneys.' },
  { name: 'Dahi Bhalla', price: 75, desc: 'Soft lentil dumplings soaked in creamy sweet yogurt and seasoned with roasted cumin.' },
  { name: 'Dahi Papdi Chaat', price: 70, desc: 'Crisp papdis with curd, mint chutney, date chutney, and pomegranate seeds.' },
  { name: 'Ragda Pattice', price: 75, desc: 'Pan-fried potato patties served with warm white pea curry and spicy sauces.' },
  { name: 'Vada Pav (2 pcs)', price: 60, desc: 'Spiced potato fritter sandwiched in soft pav bread with garlic chutney and fried chillies.' },

  // Starters, Snacks & Platters (Veg) (30)
  { name: 'Paneer Tikka', price: 180, desc: 'Charcoal grilled cottage cheese marinated in hung curd, Kashmiri chili, and carom seeds.' },
  { name: 'Hariyali Paneer Tikka', price: 185, desc: 'Cottage cheese skewers coated with mint, coriander, spinach, and green chili marinade.' },
  { name: 'Achari Paneer Tikka', price: 185, desc: 'Tangy paneer skewers marinated in spicy Indian pickling spices.' },
  { name: 'Tandoori Malai Broccoli', price: 190, desc: 'Tender broccoli florets marinated in cream cheese, cardamom, and grilled in tandoor.' },
  { name: 'Tandoori Mushroom Tikka', price: 170, desc: 'Button mushrooms stuffed with cheese and herbs, roasted to perfection.' },
  { name: 'Veg Seekh Kebab', price: 160, desc: 'Minced vegetable, cottage cheese, and cashew skewers grilled over charcoal.' },
  { name: 'Corn Cheese Balls (6 pcs)', price: 140, desc: 'Crispy fried golden spheres with a molten cheddar and sweet corn center.' },
  { name: 'Cheese Corn Nuggets', price: 130, desc: 'Breaded crispy nuggets packed with sweet corn and melted cheese.' },
  { name: 'French Fries Classic', price: 90, desc: 'Golden crisp salted potato batons served with tomato ketchup.' },
  { name: 'Peri Peri French Fries', price: 110, desc: 'Crispy French fries tossed in fiery African peri peri seasoning.' },
  { name: 'Loaded Cheese Fries', price: 140, desc: 'Fries smothered in warm melted cheddar cheese sauce and jalapenos.' },
  { name: 'Crispy Onion Rings', price: 100, desc: 'Battered and crumbed onion rings fried until crunchy and golden.' },
  { name: 'Vegetable Cutlet (2 pcs)', price: 70, desc: 'Crumb-fried potato and vegetable patties served with mint dip.' },
  { name: 'Hara Bhara Kebab', price: 140, desc: 'Pan-fried spinach, green pea, and paneer patties studded with cashews.' },
  { name: 'Soya Malai Chaap', price: 160, desc: 'Tender soya chaap chunks marinated in rich cream, cashew paste, and white pepper.' },
  { name: 'Soya Achari Tikka', price: 160, desc: 'Tangy and spicy pickled soya chaap roasted in clay oven.' },
  { name: 'Paneer 65', price: 170, desc: 'South Indian style crispy fried paneer tossed with curry leaves, yogurt, and red chillies.' },
  { name: 'Mushroom 65', price: 150, desc: 'Deep-fried button mushrooms with fiery southern spices and curry leaves.' },
  { name: 'Baby Corn 65', price: 140, desc: 'Crispy baby corn bites tossed in spicy red seasoning and curry leaves.' },
  { name: 'Crispy Veg Tempura', price: 150, desc: 'Japanese style light and airy batter-fried assorted vegetables with dipping sauce.' },
  { name: 'Nachos with Cheese Dip', price: 120, desc: 'Crispy corn tortilla chips served with warm melted cheese dip.' },
  { name: 'Loaded Nachos Supreme Veg', price: 160, desc: 'Tortilla chips topped with refried beans, salsa, jalapenos, sour cream, and cheese.' },
  { name: 'Veg Club Sandwich', price: 130, desc: 'Triple-decker toasted sandwich with cucumbers, tomatoes, cheese, and vegetable slaw.' },
  { name: 'Grilled Cheese Sandwich', price: 110, desc: 'Golden butter-toasted sandwich with gooey melted mozzarella and cheddar.' },
  { name: 'Bombay Masala Grilled Sandwich', price: 120, desc: 'Spiced potato mash, onions, beetroot, and mint chutney grilled in buttered bread.' },
  { name: 'Paneer Tikka Sandwich', price: 140, desc: 'Toasted artisan bread packed with smoky paneer tikka, capsicum, and mint mayo.' },
  { name: 'Veg Burger Classic', price: 100, desc: 'Crispy spiced vegetable patty with lettuce, tomatoes, and mayo in a sesame bun.' },
  { name: 'Double Cheese Veg Burger', price: 130, desc: 'Crispy patty loaded with two layers of cheddar cheese and secret burger sauce.' },
  { name: 'Veggie Supreme Pizza', price: 220, desc: 'Hand-tossed pizza crust topped with mozzarella, bell peppers, olives, corn, and mushrooms.' },
  { name: 'Margherita Pizza', price: 190, desc: 'Classic Italian pizza with San Marzano tomato sauce, fresh mozzarella, and basil.' }
];

const COMMON_NON_VEG = [
  // Biryanis & Pulaos (Non-Veg) (35)
  { name: 'Chicken Dum Biryani', price: 180, desc: 'Classic slow-cooked basmati rice layered with tender bone-in chicken, mint, saffron, and fried onions.' },
  { name: 'Hyderabadi Chicken Biryani', price: 200, desc: 'Authentic kacchi dum biryani marinated in rich curd, green chillies, and fried onions.' },
  { name: 'Thalassery Chicken Biryani', price: 190, desc: 'Kerala Malabar biryani made with fragrant small-grain Kaima rice, ghee, and cashew nuts.' },
  { name: 'Ambur Chicken Biryani', price: 180, desc: 'Tamil Nadu style Seeraga Samba rice biryani cooked with curd, tomato, and red chili paste.' },
  { name: 'Kolkata Chicken Biryani', price: 190, desc: 'Subtle fragrant biryani served with spiced tender chicken, soft boiled egg, and melt-in-mouth potato.' },
  { name: 'Malabar Chicken Biryani', price: 195, desc: 'Coastal Kerala dum biryani with rich roasted spices and tender chicken.' },
  { name: 'Dindigul Thalappakatti Biryani', price: 210, desc: 'Famous southern biryani cooked with Seeraga Samba rice, black pepper, and country chicken.' },
  { name: 'Mutton Dum Biryani', price: 240, desc: 'Slow-cooked succulent baby mutton chunks layered with fragrant long-grain basmati rice.' },
  { name: 'Hyderabadi Mutton Biryani', price: 260, desc: 'Traditional Nizam-style mutton biryani packed with rich spices and saffron essence.' },
  { name: 'Awadhi Mutton Biryani', price: 250, desc: 'Royal Lucknowi style biryani with tender mutton cooked in rich yakhni stock.' },
  { name: 'Lucknowi Mutton Biryani', price: 250, desc: 'Fragrant and delicate mutton biryani infused with kewra, cardamom, and mace.' },
  { name: 'Prawn Dum Biryani', price: 260, desc: 'Coastal style biryani layered with fresh ocean prawns in spicy onion-tomato gravy.' },
  { name: 'Chettinad Prawn Biryani', price: 270, desc: 'Fiery Seeraga Samba rice biryani tossed with marinated prawns and black pepper.' },
  { name: 'Fish Biryani (King Fish)', price: 250, desc: 'Delicate basmati rice layered with shallow-fried King Fish fillets in coastal spices.' },
  { name: 'Egg Dum Biryani', price: 150, desc: 'Aromatic basmati rice cooked with perfectly hard-boiled masala eggs and caramelized onions.' },
  { name: 'Special Chicken 65 Biryani', price: 210, desc: 'Flavored biryani rice topped with crispy spicy Chicken 65 bites and fried chillies.' },
  { name: 'Tandoori Chicken Biryani', price: 220, desc: 'Basmati rice layered with smoky charcoal-grilled tandoori chicken pieces.' },
  { name: 'Butter Chicken Biryani', price: 230, desc: 'Rich combination of creamy butter chicken gravy layered with saffron basmati rice.' },
  { name: 'Keema Dum Biryani', price: 240, desc: 'Spiced minced lamb cooked with basmati rice, mint, and whole garam masala.' },
  { name: 'Chicken Tikka Biryani', price: 210, desc: 'Smoky boneless chicken tikka chunks layered with spiced biryani rice.' },
  { name: 'Donne Biryani (Chicken)', price: 180, desc: 'Bangalore military hotel style green coriander and mint infused chicken biryani served in leaf cups.' },
  { name: 'Donne Biryani (Mutton)', price: 230, desc: 'Spicy Seeraga Samba mutton biryani cooked with mint paste and green chillies.' },
  { name: 'Bamboo Chicken Biryani', price: 240, desc: 'Biryani cooked inside fresh bamboo stalk over hot charcoal embers.' },
  { name: 'Potli Mutton Biryani', price: 260, desc: 'Mutton pieces slow cooked inside an aromatic herb potli and layered with saffron rice.' },
  { name: 'Prawn Fried Rice', price: 190, desc: 'Wok tossed basmati rice with juicy ocean prawns, egg ribbons, and scallions.' },
  { name: 'Egg Fried Rice', price: 130, desc: 'Fluffy rice tossed with scrambled eggs, cabbage, carrots, and light soy sauce.' },
  { name: 'Chicken Fried Rice', price: 160, desc: 'Wok-tossed long-grain rice with shredded chicken, eggs, and spring onions.' },
  { name: 'Schezwan Chicken Fried Rice', price: 170, desc: 'Spicy fried rice tossed with chicken chunks and house Schezwan chili paste.' },
  { name: 'Burnt Garlic Chicken Rice', price: 170, desc: 'Fragrant fried rice loaded with crispy golden garlic and chicken cubes.' },
  { name: 'Singapore Chicken Fried Rice', price: 175, desc: 'Zesty curry powder flavored fried rice with tender chicken, prawns, and eggs.' },
  { name: 'Egg Schezwan Rice', price: 140, desc: 'Spicy wok tossed rice with scrambled egg, red chillies, and celery.' },
  { name: 'Chicken Pulao Kashmiri', price: 180, desc: 'Mild and fragrant chicken pulao cooked with whole spices, saffron, and nuts.' },
  { name: 'Mutton Yakhni Pulao', price: 240, desc: 'Basmati rice cooked in rich, slow-simmered bone broth and tender mutton.' },
  { name: 'Chicken Yakhni Pulao', price: 180, desc: 'Long-grain rice cooked in aromatic chicken broth with fennel and dry ginger.' },
  { name: 'Fish Pulao Coastal', price: 210, desc: 'Mild coastal spiced rice preparation with pan-seared white fish fillets.' },

  // Chicken Curries & Gravies (40)
  { name: 'Butter Chicken', price: 220, desc: 'Tender tandoori chicken pieces simmered in a velvety, rich tomato, butter, and cream gravy.' },
  { name: 'Chicken Tikka Masala', price: 230, desc: 'Smoky grilled chicken tikka chunks in a spiced, creamy tomato-onion sauce.' },
  { name: 'Kadai Chicken', price: 210, desc: 'Chicken cooked with crunchy capsicum, onions, and freshly roasted coriander seeds.' },
  { name: 'Chicken Chettinad', price: 220, desc: 'Authentic Tamil spicy curry prepared with black peppercorns, roasted coconut, and star anise.' },
  { name: 'Chicken Curry Home Style', price: 180, desc: 'Homestyle chicken gravy cooked with onions, tomatoes, ginger, and ground garam masala.' },
  { name: 'Chicken Kolhapuri', price: 210, desc: 'Fiery Maharashtrian curry with roasted dry coconut and red lavangi chillies.' },
  { name: 'Chicken Korma', price: 220, desc: 'Mughlai chicken cooked in a rich, mild gravy made with cashew nuts, yogurt, and cardamom.' },
  { name: 'Mughlai Chicken', price: 230, desc: 'Rich royal preparation of chicken with boiled egg, cream, and almond paste.' },
  { name: 'Chicken Rogan Josh', price: 220, desc: 'Kashmiri style aromatic chicken curry colored with Ratan Jot and scented with fennel.' },
  { name: 'Chicken Do Pyaza', price: 210, desc: 'Chicken cooked with double the quantity of sautéed onions in spiced gravy.' },
  { name: 'Chicken Lababdar', price: 230, desc: 'Rich chicken curry cooked in an onion-tomato gravy finished with butter and grated cheese.' },
  { name: 'Handi Chicken', price: 210, desc: 'Chicken slow-cooked in a sealed clay pot with whole spices and yogurt.' },
  { name: 'Methi Chicken', price: 200, desc: 'Chicken cooked with the aromatic bitterness of fresh fenugreek leaves.' },
  { name: 'Palak Chicken', price: 200, desc: 'Tender chicken pieces cooked in garlic-infused pureed spinach gravy.' },
  { name: 'Chicken Sukka (Mangalore style)', price: 210, desc: 'Semi-dry chicken preparation with roasted grated coconut, red chillies, and curry leaves.' },
  { name: 'Andhra Spicy Chicken Curry', price: 200, desc: 'Fiery Guntur chili chicken curry with tangy tomatoes and poppy seed paste.' },
  { name: 'Malabar Chicken Curry', price: 210, desc: 'Kerala style chicken curry with coconut milk, curry leaves, and green chillies.' },
  { name: 'Chicken Madras', price: 210, desc: 'Rich and hot southern chicken curry made with tamarind, chili, and ground spices.' },
  { name: 'Chicken Saagwala', price: 200, desc: 'Chicken simmered with mustard greens and spinach, finished with fresh butter.' },
  { name: 'Chicken Changezi', price: 230, desc: 'Old Delhi style royal chicken roasted in milk, tomato puree, and fried onions.' },
  { name: 'Tawa Chicken Gravy', price: 220, desc: 'Street style chicken tossed on high heat iron griddle with tomatoes and ginger.' },
  { name: 'Chicken Vindaloo', price: 220, desc: 'Goan Portuguese-influenced hot curry with vinegar, garlic, and fiery red chillies.' },
  { name: 'Chicken Bhuna Masala', price: 210, desc: 'Chicken slow-roasted with onions and tomatoes until a thick rich masala coats every piece.' },
  { name: 'Murgh Musallam (Half)', price: 260, desc: 'Classic whole roasted chicken preparation stuffed with eggs in royal Mughlai gravy.' },
  { name: 'Garlic Chicken Masala', price: 210, desc: 'Chicken infused with deeply browned garlic cloves in savory onion gravy.' },
  { name: 'Black Pepper Chicken Curry', price: 210, desc: 'Southern style hot chicken gravy bursting with freshly ground black pepper.' },
  { name: 'Coconut Chicken Curry', price: 200, desc: 'Mild and soothing chicken cooked in fresh coconut milk and green cardamom.' },
  { name: 'Nilgiri Chicken Korma', price: 210, desc: 'Herbal green chicken curry prepared with mint, coriander, and coconut.' },
  { name: 'Chicken Kassa (Bengali style)', price: 210, desc: 'Thick and dark caramelized onion chicken curry popular in Bengali cuisine.' },
  { name: 'Dahi Chicken', price: 200, desc: 'Light and tangy chicken cooked in thick beaten yogurt with whole spices.' },
  { name: 'Chicken Pepper Masala', price: 210, desc: 'Chettinad style thick chicken masala dominated by freshly cracked black pepper.' },
  { name: 'Lemon Coriander Chicken Gravy', price: 200, desc: 'Zesty chicken in refreshing lemon and coriander gravy.' },
  { name: 'Ginger Chicken Gravy', price: 200, desc: 'Piquant chicken curry loaded with fresh ginger juliennes and green chillies.' },
  { name: 'Tomato Chicken Masala', price: 190, desc: 'Tangy homestyle chicken curry rich in ripe red tomatoes and coriander.' },
  { name: 'Green Curry Chicken (Thai style)', price: 240, desc: 'Fragrant Thai coconut curry with basil, bamboo shoots, and green chili paste.' },
  { name: 'Red Curry Chicken (Thai style)', price: 240, desc: 'Spicy Thai coconut curry with red chilies, lemongrass, and galangal.' },
  { name: 'Sesame Honey Chicken Gravy', price: 220, desc: 'Indo-Chinese style tender chicken in a glossy sweet-savory sesame sauce.' },
  { name: 'Chicken Tikka Butter Masala', price: 240, desc: 'Grilled chicken tikka in luxurious buttery cashew and tomato gravy.' },
  { name: 'Creamy Chicken Afgani Gravy', price: 230, desc: 'Mild and rich chicken cooked in cashew cream and aromatic spices.' },
  { name: 'Shahi Chicken Korma', price: 240, desc: 'Rich chicken curry garnished with silver leaf, saffron, and roasted almonds.' },

  // Mutton & Lamb Gravies (25)
  { name: 'Mutton Rogan Josh', price: 250, desc: 'Kashmiri delicacy of tender mutton cooked in aromatic spiced oil flavored with Ratan Jot and fennel.' },
  { name: 'Mutton Curry Home Style', price: 230, desc: 'Hearty homestyle mutton gravy slow-cooked with bone marrow and whole spices.' },
  { name: 'Mutton Korma Awadhi', price: 260, desc: 'Lucknowi royal mutton in rich almond-cashew and fried onion gravy.' },
  { name: 'Bhuna Gosht', price: 250, desc: 'Pan-fried mutton pieces cooked down with onions and spices to a rich, dark consistency.' },
  { name: 'Mutton Sukka', price: 250, desc: 'Mangalorean dry spiced mutton roasted with grated coconut and curry leaves.' },
  { name: 'Chettinad Mutton Chukka Gravy', price: 260, desc: 'Fiery southern mutton cooked with black peppercorns and fennel seeds.' },
  { name: 'Mutton Rara', price: 270, desc: 'Tender mutton pieces combined with spiced minced mutton (keema) in rich gravy.' },
  { name: 'Dal Gosht', price: 230, desc: 'Tender mutton cooked with slow-simmered lentils and tempered with cumin and ghee.' },
  { name: 'Mutton Keema Matar', price: 220, desc: 'Spiced minced lamb cooked with sweet green peas and ginger.' },
  { name: 'Mutton Handi', price: 250, desc: 'Mutton slow-cooked in a sealed earthen pot with aromatic herbs and curd.' },
  { name: 'Mutton Kadhai', price: 250, desc: 'Mutton pieces cooked with capsicum and freshly pounded coriander seeds.' },
  { name: 'Mutton Kolhapuri', price: 260, desc: 'Spicy Maharashtra mutton curry cooked with fiery Kolhapuri red chillies.' },
  { name: 'Gongura Mutton', price: 250, desc: 'Andhra specialty of tender mutton cooked with tangy sorrel (gongura) leaves.' },
  { name: 'Mutton Pepper Fry Gravy', price: 250, desc: 'South Indian mutton curry dominated by freshly roasted crushed black pepper.' },
  { name: 'Nalli Nihari', price: 280, desc: 'Mughlai slow-cooked mutton shank stew simmered overnight with bone marrow.' },
  { name: 'Mutton Paya Soup & Gravy', price: 220, desc: 'Nutritious slow-simmered lamb trotter broth and gravy cooked with spices.' },
  { name: 'Mutton Saagwala', price: 240, desc: 'Mutton pieces simmered with pureed mustard greens and spinach.' },
  { name: 'Champaran Mutton Curry', price: 270, desc: 'Ahuna mutton slow-cooked with whole garlic bulbs in sealed earthen clay pots.' },
  { name: 'Kosha Mangsho', price: 260, desc: 'Bengali slow-braised mutton with dark caramelized onions, potatoes, and mustard oil.' },
  { name: 'Laal Maas', price: 270, desc: 'Famous Rajasthani fiery red mutton curry cooked with Mathania chillies.' },
  { name: 'Mutton Do Pyaza', price: 250, desc: 'Tender mutton stewed with twice the volume of sweet caramelized onions.' },
  { name: 'Kashmiri Gushtaba', price: 270, desc: 'Velvety minced mutton meatballs cooked in rich yogurt gravy flavored with dry mint.' },
  { name: 'Malabar Mutton Curry', price: 260, desc: 'Coastal Kerala mutton cooked in thick coconut milk and spices.' },
  { name: 'Achari Mutton Masala', price: 250, desc: 'Mutton curry infused with aromatic pickle spices like kalonji, mustard, and fennel.' },
  { name: 'Mutton Vindaloo', price: 260, desc: 'Goan spicy and tangy mutton stewed in vinegar, garlic, and Kashmiri red chillies.' },

  // Seafood & Fish Curries (30)
  { name: 'Goan Fish Curry', price: 220, desc: 'Fresh fish simmered in tangy coconut milk with kokum and ground Goan spices.' },
  { name: 'Malabar Fish Curry', price: 230, desc: 'Kerala fish curry with coconut milk, green chillies, and kudampuli (pot tamarind).' },
  { name: 'Chettinad Fish Curry', price: 220, desc: 'Fiery south Indian fish curry infused with black pepper, shallots, and tamarind.' },
  { name: 'Fish Tikka Masala', price: 240, desc: 'Tandoori grilled fish fillets cooked in rich spiced tomato-onion gravy.' },
  { name: 'Bengali Macher Jhol', price: 210, desc: 'Light and comforting mustard-oil fish curry cooked with potatoes and kalonji.' },
  { name: 'Meen Kulambu', price: 220, desc: 'Tangy Tamil Nadu village-style fish curry with tamarind, garlic, and shallots.' },
  { name: 'Fish Moilee', price: 240, desc: 'Mild Kerala stew of fresh fish, coconut milk, curry leaves, and ginger.' },
  { name: 'Mangalorean Fish Curry', price: 230, desc: 'Coastal Karnataka fish curry flavored with Byadgi chillies and fresh coconut.' },
  { name: 'King Fish Fry Gravy', price: 250, desc: 'Pan-seared Seer fish slices simmered in rich spicy tomato-onion reduction.' },
  { name: 'Pomfret Masala', price: 260, desc: 'Whole pomfret fish cooked in an aromatic, spicy coastal masala.' },
  { name: 'Surmai Fish Curry', price: 250, desc: 'Tender King Fish steaks simmered in savory coastal coconut gravy.' },
  { name: 'Prawn Masala', price: 240, desc: 'Juicy ocean prawns sautéed in onion-tomato masala with ginger and garlic.' },
  { name: 'Prawns Butter Garlic Gravy', price: 260, desc: 'Plump prawns simmered in creamy butter sauce infused with roasted minced garlic.' },
  { name: 'Chettinad Prawn Curry', price: 250, desc: 'Fiery south Indian prawn curry with roasted spices and black pepper.' },
  { name: 'Goan Prawn Curry with Coconut', price: 240, desc: 'Traditional Goan prawn curry with fresh coconut paste and dried kokum.' },
  { name: 'Malai Prawn Curry (Chingri Malai)', price: 270, desc: 'Bengali royal curry of tiger prawns cooked in creamy coconut milk and ghee.' },
  { name: 'Prawn Balchao', price: 250, desc: 'Goan hot and tangy pickled prawn preparation with red chili vinegar paste.' },
  { name: 'Crab Masala Gravy', price: 280, desc: 'Whole sea crab cooked in a rich, deeply spiced black pepper and fennel gravy.' },
  { name: 'Chettinad Crab Curry', price: 290, desc: 'Coastal crab cooked with shallots, curry leaves, and fresh ground Chettinad spices.' },
  { name: 'Garlic Butter Prawns', price: 260, desc: 'Tiger prawns pan-seared with golden garlic, butter, and parsley.' },
  { name: 'Tawa Fish Masala', price: 230, desc: 'Fish fillets pan-roasted on iron tawa with crushed spices and onions.' },
  { name: 'Squid Pepper Roast', price: 230, desc: 'Tender squid rings dry-roasted with black pepper, onions, and curry leaves.' },
  { name: 'Squid Masala Gravy', price: 240, desc: 'Coastal squid cooked in tangy tamarind and spicy coconut gravy.' },
  { name: 'Fish Amritsari Gravy', price: 220, desc: 'Carom seed flavored fish in Punjabi onion-tomato gravy.' },
  { name: 'Fish Korma', price: 230, desc: 'Delicate fish fillets simmered in mild cashew and yogurt gravy.' },
  { name: 'Prawn Kadai', price: 240, desc: 'Prawns and crunchy bell peppers tossed in spicy kadai coriander masala.' },
  { name: 'Fish Madras Curry', price: 220, desc: 'Hot and tangy fish curry in Madras style spiced red gravy.' },
  { name: 'Coastal Fish Curry with Raw Mango', price: 230, desc: 'Seasonal fish cooked with tart raw green mango slices and coconut milk.' },
  { name: 'Mustard Fish Curry (Shorshe Maach)', price: 240, desc: 'Bengali fish curry pungent with ground yellow and black mustard paste.' },
  { name: 'Spicy Prawn Ghee Roast', price: 270, desc: 'Kundapura coastal prawns slow-roasted in pure ghee and Byadgi chili paste.' },

  // Tandoori, Kebabs & Starters (40)
  { name: 'Tandoori Chicken (Half)', price: 200, desc: 'Bone-in chicken marinated in yogurt and tandoori spices, roasted in clay oven.' },
  { name: 'Tandoori Chicken (Full)', price: 380, desc: 'Whole chicken marinated in mustard oil, hung curd, and roasted over charcoal.' },
  { name: 'Chicken Tikka', price: 200, desc: 'Six boneless chicken chunks marinated in spiced yogurt and charred on skewers.' },
  { name: 'Chicken Malai Tikka', price: 220, desc: 'Creamy chicken chunks marinated in hung curd, cream cheese, and cardamom.' },
  { name: 'Chicken Hariyali Tikka', price: 200, desc: 'Boneless chicken marinated with mint, coriander, and spinach paste.' },
  { name: 'Chicken Achari Tikka', price: 200, desc: 'Spicy and tangy chicken skewers marinated with Indian pickling spices.' },
  { name: 'Chicken Seekh Kebab', price: 210, desc: 'Minced chicken blended with herbs, garlic, and spices, skewered over embers.' },
  { name: 'Mutton Seekh Kebab', price: 250, desc: 'Juicy spiced minced lamb skewers grilled over charcoal, served with mint dip.' },
  { name: 'Chicken Reshmi Kebab', price: 220, desc: 'Silky and tender chicken kebabs enriched with egg and cashew cream.' },
  { name: 'Chicken Tangdi Kebab', price: 210, desc: 'Two chicken drumsticks stuffed with spiced chicken mince and grilled.' },
  { name: 'Tandoori Chicken Wings', price: 190, desc: 'Crispy clay oven roasted chicken wings coated in smoky tandoori rub.' },
  { name: 'Chicken 65', price: 180, desc: 'Crispy deep-fried chicken cubes tossed with curry leaves, green chillies, and yogurt.' },
  { name: 'Chicken Lollipop (6 pcs)', price: 190, desc: 'Crispy fried frenched chicken wings tossed in Indo-Chinese chili sauce.' },
  { name: 'Chicken Lollipop Gravy', price: 200, desc: 'Chicken lollipops bathed in a rich, tangy Schezwan-garlic gravy.' },
  { name: 'Crispy Fried Chicken', price: 180, desc: 'Southern-style buttermilk soaked chicken deep-fried to a golden crisp.' },
  { name: 'Chicken Popcorn', price: 140, desc: 'Bite-sized seasoned chicken nuggets fried crisp, served with dip.' },
  { name: 'Chicken Shawarma Plate', price: 170, desc: 'Thinly sliced spit-roasted chicken served with garlic toum, pickles, and pita bread.' },
  { name: 'Chicken Shawarma Roll', price: 130, desc: 'Warm rumali roti rolled with spiced roasted chicken, garlic mayo, and pickled cucumbers.' },
  { name: 'Mutton Galouti Kebab', price: 260, desc: 'Melt-in-mouth Awadhi minced lamb patties flavored with 160 secret royal spices.' },
  { name: 'Shami Kebab Mutton', price: 240, desc: 'Tender pan-fried patties made from minced mutton and chana dal.' },
  { name: 'Fish Tikka (Tandoori)', price: 240, desc: 'Six chunks of tender fish marinated in mustard oil, carom seeds, and yogurt.' },
  { name: 'Fish Amritsari Fry', price: 220, desc: 'Crisp gram-flour battered fish fillets flavored with ajwain and lemon juice.' },
  { name: 'Tawa Fish Fry', price: 230, desc: 'Shallow-fried fish coated with spicy homemade chili and tamarind paste.' },
  { name: 'Crispy Fish Fingers (6 pcs)', price: 200, desc: 'Breaded white fish batons fried crisp, served with creamy tartar sauce.' },
  { name: 'Tandoori Prawns (6 pcs)', price: 270, desc: 'Jumbo prawns marinated in tandoori masala and charred in clay oven.' },
  { name: 'Prawn Koliwada', price: 250, desc: 'Mumbai fisherman-style crispy battered and deep-fried spicy prawns.' },
  { name: 'Golden Fried Prawns', price: 250, desc: 'Crispy batter-fried prawns served with sweet and sour dipping sauce.' },
  { name: 'Pepper Chicken Dry', price: 190, desc: 'South Indian style dry chicken roasted with crushed black pepper and onions.' },
  { name: 'Lemon Pepper Chicken', price: 190, desc: 'Tangy and peppery grilled chicken bites with fresh lemon juice.' },
  { name: 'Chicken Chukka', price: 200, desc: 'Chettinad pan-roasted dry chicken cooked with shallots, fennel, and curry leaves.' },
  { name: 'Mutton Chukka Dry', price: 260, desc: 'Pan-roasted tender mutton bites dry-tossed with pepper, onions, and curry leaves.' },
  { name: 'Chicken Sukka Dry', price: 200, desc: 'Mangalorean dry chicken tossed with roasted coconut flakes and spices.' },
  { name: 'Chili Chicken Dry', price: 180, desc: 'Wok-tossed chicken cubes with green chillies, bell peppers, garlic, and soy sauce.' },
  { name: 'Chili Chicken Gravy', price: 190, desc: 'Tender chicken cubes in glossy Indo-Chinese spicy chili-soy gravy.' },
  { name: 'Dragon Chicken', price: 190, desc: 'Crispy fried chicken strips tossed in spicy cashew-chili sauce.' },
  { name: 'Kung Pao Chicken', price: 210, desc: 'Stir-fried chicken with peanuts, dried red chillies, and scallions in savory sauce.' },
  { name: 'Schezwan Chicken Wings', price: 190, desc: 'Crisp wings tossed in homemade spicy and numbing Schezwan sauce.' },
  { name: 'Chicken Spring Rolls', price: 130, desc: 'Crispy rolls filled with shredded chicken, cabbage, and carrots.' },
  { name: 'Steamed Chicken Momos', price: 110, desc: 'Six delicate steamed dumplings with juicy minced chicken and herbs.' },
  { name: 'Fried Chicken Momos', price: 120, desc: 'Crispy golden fried momos with savory chicken filling.' },

  // Burgers, Wraps, Rolls & Egg Delights (30)
  { name: 'Classic Chicken Burger', price: 140, desc: 'Grilled chicken patty with crisp lettuce, tomato, cheese, and herb mayo.' },
  { name: 'Crispy Chicken Zinger Burger', price: 170, desc: 'Deep-fried crispy battered chicken breast with spicy sauce in sesame bun.' },
  { name: 'Double Patty Chicken Burger', price: 210, desc: 'Two juicy chicken patties layered with double cheese and secret sauce.' },
  { name: 'BBQ Chicken Bacon Burger', price: 220, desc: 'Grilled chicken patty topped with smoky BBQ sauce, bacon, and cheddar.' },
  { name: 'Chicken Keema Burger', price: 160, desc: 'Spicy Indian minced chicken masala burger with mint mayo.' },
  { name: 'Egg Burger Deluxe', price: 110, desc: 'Fried egg, fresh veggies, and spiced mayo in toasted brioche bun.' },
  { name: 'Kolkata Chicken Egg Roll', price: 130, desc: 'Flaky paratha layered with fried egg, spiced chicken chunks, onions, and lime juice.' },
  { name: 'Double Egg Double Chicken Roll', price: 160, desc: 'Loaded street-style roll with two eggs and double the portion of spicy chicken.' },
  { name: 'Chicken Tikka Kathi Roll', price: 140, desc: 'Charcoal grilled chicken tikka and sliced peppers wrapped in warm paratha.' },
  { name: 'Mutton Seekh Roll', price: 180, desc: 'Grilled mutton seekh kebab wrapped in roomali roti with mint chutney.' },
  { name: 'Chicken Shawarma Pita Wrap', price: 140, desc: 'Authentic Mediterranean pita filled with rotisserie chicken and garlic toum.' },
  { name: 'Grilled Chicken Club Sandwich', price: 160, desc: 'Triple-decker sandwich with grilled chicken breast, boiled egg, cheese, and lettuce.' },
  { name: 'Chicken Mayo Sandwich', price: 120, desc: 'Classic shredded chicken and creamy herb mayo in soft white bread.' },
  { name: 'BBQ Chicken Sub', price: 170, desc: 'Six-inch crusty sub roll loaded with pulled BBQ chicken, jalapenos, and melted cheese.' },
  { name: 'Egg Curry', price: 120, desc: 'Two hard-boiled eggs simmered in a spiced onion, tomato, and garam masala gravy.' },
  { name: 'Boiled Egg Masala Fry', price: 90, desc: 'Hard-boiled eggs pan-fried with red chili powder, turmeric, and onions.' },
  { name: 'Egg Bhurji', price: 90, desc: 'Three eggs scrambled on high heat with onions, tomatoes, and green chillies.' },
  { name: 'Egg Omelette with Cheese', price: 100, desc: 'Fluffy two-egg omelette filled with melted mozzarella and herbs.' },
  { name: 'Masala Omelette with Bread', price: 90, desc: 'Indian style spiced omelette served with two slices of buttered toast.' },
  { name: 'Shakshuka with Bread', price: 140, desc: 'Poached eggs nestled in a simmering spiced bell pepper and tomato sauce.' },
  { name: 'Egg Roast (Kerala style)', price: 130, desc: 'Hard-boiled eggs coated in thick caramelized onion-tomato masala.' },
  { name: 'Chettinad Egg Masala', price: 130, desc: 'Hard-boiled eggs simmered in fiery black pepper and fennel Chettinad gravy.' },
  { name: 'Scrambled Eggs on Butter Toast', price: 95, desc: 'Creamy soft-scrambled eggs served on thick slices of buttered sourdough.' },
  { name: 'Fried Boiled Eggs (4 pcs)', price: 80, desc: 'Whole boiled eggs scored and shallow-fried in ghee and chili powder.' },
  { name: 'Egg Kothu Parotta', price: 130, desc: 'Shredded flaky parotta shredded on tawa with scrambled eggs, onions, and spicy salan.' },
  { name: 'Chicken Kothu Parotta', price: 170, desc: 'Tawa-chopped parotta tossed with shredded chicken, eggs, and rich gravy.' },
  { name: 'Chicken Biryani Rice with Boiled Egg', price: 130, desc: 'Plate of seasoned biryani rice served with one boiled egg and raita.' },
  { name: 'Chicken Nuggets (8 pcs)', price: 130, desc: 'Golden breaded chicken nuggets served with honey mustard dip.' },
  { name: 'Stuffed Omelette with Chicken Keema', price: 140, desc: 'Two-egg omelette folded over savory spiced chicken mince.' },
  { name: 'Tandoori Egg Tikka', price: 110, desc: 'Boiled eggs marinated in yogurt and tandoori spices, grilled in clay oven.' }
];

const COMMON_DRINKS = [
  // Fresh Fruit Juices & Coolers (20)
  { name: 'Fresh Lime Soda (Sweet)', price: 60, desc: 'Freshly squeezed lime juice with bubbly soda and organic sugar syrup.' },
  { name: 'Fresh Lime Soda (Salt)', price: 60, desc: 'Refreshing lime juice with sparkling club soda, black salt, and cumin.' },
  { name: 'Watermelon Juice', price: 80, desc: 'Fresh cold-pressed watermelon juice served chilled with a hint of mint.' },
  { name: 'Mosambi Juice', price: 80, desc: 'Freshly extracted sweet lime juice with a pinch of black salt.' },
  { name: 'Orange Juice', price: 90, desc: 'Pure freshly squeezed orange juice packed with natural vitamin C.' },
  { name: 'Pineapple Juice with Mint', price: 85, desc: 'Sweet and tangy tropical pineapple juice blended with fresh garden mint.' },
  { name: 'Pomegranate Juice', price: 110, desc: 'Pure ruby-red pomegranate juice with rich antioxidants.' },
  { name: 'ABC Juice', price: 110, desc: 'Power juice of apple, beetroot, and carrot for radiant health.' },
  { name: 'Mango Juice Fresh', price: 90, desc: 'Thick fresh Alphonso mango juice served chilled.' },
  { name: 'Guava Juice with Chili Salt', price: 80, desc: 'Pink guava juice served with a spiced chili-salt rim on the glass.' },
  { name: 'Tender Coconut Water', price: 60, desc: 'Natural fresh coconut water served in shell.' },
  { name: 'Coconut Water with Pulp', price: 75, desc: 'Chilled tender coconut water blended with soft coconut malai.' },
  { name: 'Sugarcane Juice with Ginger', price: 60, desc: 'Cold extracted fresh sugarcane juice infused with ginger and lemon.' },
  { name: 'Lemon Mint Cooler', price: 70, desc: 'Crushed ice cooler with fresh mint leaves, lemon juice, and rock salt.' },
  { name: 'Virgin Mojito', price: 95, desc: 'Muddled fresh mint, lime wedges, simple syrup, and sparkling soda over crushed ice.' },
  { name: 'Blue Curacao Mocktail', price: 100, desc: 'Vibrant blue citrus mocktail with lemonade and crushed ice.' },
  { name: 'Ginger Ale Limeade', price: 90, desc: 'Spicy ginger infusion with fresh lime juice and effervescent soda.' },
  { name: 'Iced Lemon Tea', price: 75, desc: 'Brewed black tea chilled with fresh lemon juice and organic honey.' },
  { name: 'Peach Iced Tea', price: 85, desc: 'Chilled brewed tea flavored with sweet white peach syrup and lemon.' },
  { name: 'Passionfruit Iced Tea', price: 90, desc: 'Tropical passionfruit infused iced black tea with fresh mint.' },

  // Lassis & Traditional Yogurt Coolers (15)
  { name: 'Sweet Lassi', price: 70, desc: 'Thick traditional churned yogurt drink sweetened and topped with clotted cream (malai).' },
  { name: 'Mango Lassi', price: 90, desc: 'Thick yogurt blended with rich Alphonso mango pulp and cardamom.' },
  { name: 'Strawberry Lassi', price: 90, desc: 'Creamy yogurt blended with fresh crushed strawberry compote.' },
  { name: 'Rose Lassi', price: 80, desc: 'Refreshing yogurt drink infused with fragrant rose petal preserve (gulkand).' },
  { name: 'Salted Jeera Lassi', price: 70, desc: 'Savory yogurt cooler seasoned with roasted cumin and rock salt.' },
  { name: 'Masala Buttermilk (Chaas)', price: 50, desc: 'Light churned yogurt seasoned with ginger, green chillies, curry leaves, and coriander.' },
  { name: 'Neer Moru', price: 50, desc: 'South Indian summer cooler with watered buttermilk, mustard seeds, and asafoetida.' },
  { name: 'Mint Buttermilk', price: 55, desc: 'Refreshing buttermilk blended with fresh garden mint leaves and rock salt.' },
  { name: 'Cucumber Cooler Buttermilk', price: 60, desc: 'Chilled buttermilk blended with hydrating cucumber juice and cumin.' },
  { name: 'Kesar Pista Lassi', price: 100, desc: 'Royal thick lassi flavored with saffron strands and crushed pistachios.' },
  { name: 'Dry Fruit Special Lassi', price: 120, desc: 'Loaded lassi garnished with cashews, almonds, raisins, and pistachios.' },
  { name: 'Banana Lassi', price: 80, desc: 'Creamy yogurt blended with ripe bananas and a touch of honey.' },
  { name: 'Cardamom Sweet Lassi', price: 75, desc: 'Traditional sweet lassi scented with green cardamom powder.' },
  { name: 'Beetroot Chaas', price: 60, desc: 'Vibrant pink buttermilk infused with roasted beetroot puree and chaat masala.' },
  { name: 'Smoked Cumin Buttermilk', price: 60, desc: 'Chaas infused with charcoal-smoked cumin and clarified butter.' },

  // Milkshakes & Smoothies (15)
  { name: 'Thick Mango Milkshake', price: 110, desc: 'Rich milkshake made with Alphonso mango pulp and full cream milk.' },
  { name: 'Chocolate Truffle Milkshake', price: 120, desc: 'Decadent chocolate milkshake made with melted Belgian truffle and cocoa.' },
  { name: 'Vanilla Bean Milkshake', price: 100, desc: 'Classic thick shake prepared with pure Madagascar vanilla extract and ice cream.' },
  { name: 'Strawberry Milkshake', price: 110, desc: 'Creamy milkshake blended with fresh strawberries and strawberry ice cream.' },
  { name: 'Oreo Overload Shake', price: 130, desc: 'Thick shake blended with crunchy Oreo cookies and chocolate drizzle.' },
  { name: 'KitKat Crunchy Shake', price: 130, desc: 'Creamy shake loaded with crushed KitKat chocolate bars and fudge.' },
  { name: 'Nutella Hazelnut Shake', price: 150, desc: 'Rich and creamy shake blended with generous spoonfuls of authentic Nutella.' },
  { name: 'Banana Caramel Milkshake', price: 120, desc: 'Ripe bananas and buttery caramel sauce blended into a thick shake.' },
  { name: 'Cold Badam Milk with Kesar', price: 90, desc: 'Traditional almond milk infused with pure saffron and crushed cardamom.' },
  { name: 'Rose Milk with Sabja Seeds', price: 70, desc: 'Chilled sweet rose milk loaded with cooling basil (sabja) seeds.' },
  { name: 'Pista Milkshake', price: 120, desc: 'Rich green milkshake loaded with roasted pistachio paste and nuts.' },
  { name: 'Butterscotch Milkshake', price: 110, desc: 'Creamy shake with crunchy butterscotch praline and caramel.' },
  { name: 'Peanut Butter Choco Shake', price: 130, desc: 'Creamy peanut butter and cocoa blended with chilled milk.' },
  { name: 'Apple Cinnamon Milkshake', price: 110, desc: 'Fresh apple puree blended with chilled milk and a pinch of ground cinnamon.' },
  { name: 'Chikoo Milkshake', price: 100, desc: 'Sweet sapodilla fruit blended into a rich and grainy natural shake.' }
];

const COMMON_COFFEE = [
  // South Indian & Traditional Coffees (10)
  { name: 'Madras Filter Coffee', price: 40, desc: 'Authentic South Indian chicory blend coffee frothed with boiling full cream milk in a brass davarah.' },
  { name: 'Kumbakonam Degree Coffee', price: 50, desc: 'Legendary pure cow milk filter coffee prepared with first-drip decoction.' },
  { name: 'Jaggery Filter Coffee', price: 50, desc: 'Filter coffee naturally sweetened with organic palm jaggery.' },
  { name: 'Cardamom Filter Coffee', price: 50, desc: 'South Indian filter coffee infused with freshly crushed green cardamom.' },
  { name: 'Sukku Coffee', price: 45, desc: 'Traditional herbal brew made with dry ginger, coriander seeds, black pepper, and jaggery.' },
  { name: 'Coconut Milk Filter Coffee', price: 65, desc: 'Dairy-free southern filter coffee prepared with freshly extracted coconut milk.' },
  { name: 'Brass Davarah Filter Coffee Special', price: 55, desc: 'Extra strong filter coffee frothed to perfection in traditional brass serveware.' },
  { name: 'Mysore Plantation A Brew', price: 60, desc: 'Single-origin washed Arabica from Karnataka estates, brewed fresh.' },
  { name: 'Malabar Robusta Dark Roast', price: 55, desc: 'Bold, smoky dark roast coffee with intense crema and deep chocolate notes.' },
  { name: 'Chikmagalur Pour-Over', price: 75, desc: 'Artisan single-cup pour-over coffee using locally grown estate beans.' },

  // Hot Espresso & Cafe Classics (15)
  { name: 'Single Espresso Shot', price: 70, desc: 'Intense 30ml concentrated extraction of pure Arabica beans with hazelnut crema.' },
  { name: 'Double Espresso (Doppio)', price: 90, desc: 'Two shots of rich espresso extracted under 9 bars of pressure.' },
  { name: 'Classic Cappuccino', price: 110, desc: 'Equal parts rich espresso, steamed milk, and a thick layer of dense velvety milk foam.' },
  { name: 'Cafe Latte', price: 120, desc: 'Smooth shot of espresso blended with plenty of steamed milk and light microfoam.' },
  { name: 'Flat White', price: 120, desc: 'Double ristretto shot blended with velvety microfoam for a smooth, intense coffee flavor.' },
  { name: 'Americano', price: 90, desc: 'Rich double espresso diluted with hot water for a smooth black coffee.' },
  { name: 'Cafe Mocha', price: 140, desc: 'Espresso combined with dark chocolate sauce, steamed milk, and whipped cream.' },
  { name: 'Caramel Macchiato', price: 140, desc: 'Steamed vanilla milk marked with espresso and drizzled with buttery caramel.' },
  { name: 'Vanilla Latte', price: 130, desc: 'Smooth cafe latte infused with fragrant natural Madagascar vanilla syrup.' },
  { name: 'Hazelnut Cappuccino', price: 130, desc: 'Frothy cappuccino infused with roasted hazelnut essence.' },
  { name: 'Cortado', price: 100, desc: 'Equal parts rich espresso and warm steamed milk to cut the acidity.' },
  { name: 'Affogato', price: 120, desc: 'Scoop of creamy vanilla ice cream drowned in a hot shot of freshly extracted espresso.' },
  { name: 'Irish Coffee (Non-alcoholic)', price: 140, desc: 'Hot black coffee flavored with Irish cream syrup, topped with thick cream.' },
  { name: 'Spanish Latte', price: 140, desc: 'Espresso mixed with sweet condensed milk and hot textured milk.' },
  { name: 'Cinnamon Dolce Latte', price: 135, desc: 'Spiced latte with cinnamon syrup and sweet brown sugar topping.' },

  // Cold Coffees & Frappes (15)
  { name: 'Cold Coffee', price: 110, desc: 'Classic chilled coffee blended with cold milk, sugar, and crushed ice.' },
  { name: 'Thick Cold Coffee with Ice Cream', price: 130, desc: 'Rich cold coffee topped with a generous scoop of vanilla bean ice cream.' },
  { name: 'Iced Americano', price: 95, desc: 'Double espresso poured over chilled water and crystal-clear ice cubes.' },
  { name: 'Iced Caramel Macchiato', price: 140, desc: 'Chilled milk, vanilla syrup, espresso float, and a sweet caramel drizzle.' },
  { name: 'Mocha Frappe', price: 145, desc: 'Blended coffee, chocolate fudge, milk, and ice topped with whipped cream.' },
  { name: 'Java Chip Frappe', price: 150, desc: 'Blended coffee shake packed with crunchy dark chocolate chips and chocolate drizzle.' },
  { name: 'Hazelnut Iced Latte', price: 135, desc: 'Chilled espresso and milk infused with roasted hazelnut syrup over ice.' },
  { name: 'Cold Brew Coffee', price: 120, desc: 'Smooth, naturally sweet artisan coffee steeped in cold water for 18 hours.' },
  { name: 'Cold Brew with Tonic', price: 135, desc: 'Artisan cold brew poured over sparkling tonic water with a slice of orange.' },
  { name: 'Vietnamese Iced Coffee', price: 130, desc: 'Dark roasted drip coffee served over sweet condensed milk and ice.' },
  { name: 'Dalgona Coffee', price: 120, desc: 'Whipped sweet coffee cream layered over chilled fresh milk.' },
  { name: 'Salted Caramel Cold Brew', price: 140, desc: 'Cold brew coffee topped with a layer of salted caramel cold foam.' },
  { name: 'Iced Vanilla Bean Latte', price: 130, desc: 'Chilled espresso and milk lightly sweetened with vanilla bean syrup.' },
  { name: 'Espresso Tonic', price: 120, desc: 'Double espresso shot poured over sparkling tonic water with fresh lime.' },
  { name: 'White Chocolate Frappe', price: 145, desc: 'Creamy white chocolate and coffee blended with ice and topped with cream.' }
];

const COMMON_DESSERT = [
  // Traditional Indian Sweets (25)
  { name: 'Gulab Jamun (2 pcs)', price: 70, desc: 'Deep-fried golden milk-solid dumplings soaked in warm rose and cardamom scented sugar syrup.' },
  { name: 'Kala Jamun with Rabri', price: 100, desc: 'Dark caramelized jamuns served warm over a bed of chilled thick rabri.' },
  { name: 'Rasgulla (2 pcs)', price: 60, desc: 'Spongy cottage cheese spheres cooked in light, fragrant sugar syrup.' },
  { name: 'Rasmalai (2 pcs)', price: 90, desc: 'Soft cottage cheese patties immersed in saffron and cardamom flavored condensed milk.' },
  { name: 'Angoori Rasmalai', price: 110, desc: 'Mini grape-sized chenna patties in rich saffron milk garnished with slivered pistachios.' },
  { name: 'Motichoor Ladoo (4 pcs)', price: 80, desc: 'Tiny fried gram flour pearls bound in pure ghee and sugar, flavored with cardamom.' },
  { name: 'Besan Ladoo (4 pcs)', price: 80, desc: 'Roasted gram flour balls sweetened with bura sugar and infused with pure ghee.' },
  { name: 'Kaju Katli (100g)', price: 140, desc: 'Diamond-shaped delicate fudge made with finely ground cashew nuts and silver foil.' },
  { name: 'Milk Cake', price: 100, desc: 'Traditional grainy caramelized milk fudge with dual tones and rich flavor.' },
  { name: 'Peda (Mathura style)', price: 85, desc: 'Caramelized khoya rounds flavored with cardamom and sugar.' },
  { name: 'Mysore Pak', price: 90, desc: 'Royal melt-in-the-mouth gram flour sweet dripping with pure aromatic ghee.' },
  { name: 'Dry Fruit Halwa', price: 110, desc: 'Chewy gelatinous halwa packed with figs, dates, cashews, and almonds.' },
  { name: 'Gajar Ka Halwa', price: 110, desc: 'Slow-cooked grated red carrots in full-fat milk, ghee, mawa, and fried cashews.' },
  { name: 'Moong Dal Halwa', price: 120, desc: 'Rich golden sweet made from split yellow lentils roasted in abundant pure ghee.' },
  { name: 'Sooji Halwa (Kesari)', price: 75, desc: 'Semolina roasted in ghee with saffron, cashews, and plump golden raisins.' },
  { name: 'Shahi Tukda', price: 95, desc: 'Crisp ghee-fried bread triangles soaked in saffron syrup and topped with rabri.' },
  { name: 'Phirni in Clay Pot', price: 85, desc: 'Creamy slow-cooked ground rice pudding flavored with saffron, cardamom, and rose water.' },
  { name: 'Basundi', price: 95, desc: 'Slow-simmered sweetened milk reduced to thick consistency, flavored with nutmeg and nuts.' },
  { name: 'Malpua with Rabri', price: 110, desc: 'Fluffy fried pancakes dipped in sugar syrup and served with creamy rabri.' },
  { name: 'Jalebi (Hot & Crispy)', price: 60, desc: 'Deep-fried fermented batter spirals soaked in warm saffron sugar syrup.' },
  { name: 'Imarti with Rabri', price: 90, desc: 'Intricately piped urad dal flower sweet dipped in syrup and paired with rabri.' },
  { name: 'Rabri Cup', price: 80, desc: 'Thick, creamy layers of slow-simmered milk skin (malai) sweetened and chilled.' },
  { name: 'Paan Kulfi', price: 70, desc: 'Traditional dense ice cream flavored with betel leaves, gulkand, and fennel.' },
  { name: 'Malai Kulfi', price: 65, desc: 'Classic slow-cooked frozen dairy dessert flavored with green cardamom.' },
  { name: 'Matka Kulfi', price: 85, desc: 'Traditional kulfi served inside a rustic clay pot topped with pistachios.' },

  // Ice Creams & Western Desserts (25)
  { name: 'Vanilla Ice Cream', price: 70, desc: 'Classic double scoop of rich and creamy vanilla bean ice cream.' },
  { name: 'Chocolate Brownie', price: 95, desc: 'Fudgy, dense chocolate brownie baked with dark cocoa and walnuts.' },
  { name: 'Chocolate Cake', price: 130, desc: 'Rich triple-layer moist chocolate sponge cake layered with dark chocolate ganache.' },
  { name: 'Belgian Dark Chocolate Ice Cream', price: 90, desc: 'Intense 70% dark cocoa ice cream scoop with rich bittersweet notes.' },
  { name: 'Alphonso Mango Ice Cream', price: 85, desc: 'Creamy seasonal ice cream packed with real Alphonso mango pulp.' },
  { name: 'Roasted Almond Ice Cream', price: 90, desc: 'Nutty ice cream loaded with crunchy roasted salted almond chunks.' },
  { name: 'Tender Coconut Ice Cream', price: 90, desc: 'Velvety ice cream made with real tender coconut water and tender pulp.' },
  { name: 'Butterscotch Crunch Scoop', price: 80, desc: 'Creamy caramel ice cream loaded with crunchy golden praline bits.' },
  { name: 'Strawberry Cheesecake Ice Cream', price: 95, desc: 'Cream cheese base ice cream with strawberry swirl and graham cracker bits.' },
  { name: 'Sizzling Brownie with Ice Cream', price: 150, desc: 'Warm walnut brownie on a smoking cast iron sizzler with vanilla ice cream and hot fudge.' },
  { name: 'Hot Chocolate Fudge Sundae', price: 130, desc: 'Two scoops of vanilla ice cream drowned in thick hot chocolate fudge and peanuts.' },
  { name: 'Death by Chocolate Sundae', price: 160, desc: 'Chocolate cake, brownie, chocolate ice cream, fudge, cherries, and choco chips.' },
  { name: 'Banana Split Supreme', price: 140, desc: 'Fresh banana flanked by trio of vanilla, strawberry, and chocolate scoops with sauces.' },
  { name: 'Knickerbocker Glory', price: 150, desc: 'Tall glass layered with fruit compote, jelly, ice cream scoops, and whipped cream.' },
  { name: 'Red Velvet Pastry', price: 110, desc: 'Soft cocoa red sponge layered with rich cream cheese frosting.' },
  { name: 'New York Baked Cheesecake', price: 160, desc: 'Classic dense baked cream cheese cake on a golden buttery biscuit crust.' },
  { name: 'Blueberry Cheesecake', price: 170, desc: 'Baked New York cheesecake topped with sweet and tart blueberry compote.' },
  { name: 'Tiramisu Classic Italian', price: 160, desc: 'Coffee-soaked savoiardi ladyfingers layered with mascarpone cream and cocoa.' },
  { name: 'Warm Apple Pie', price: 120, desc: 'Spiced cinnamon apple filling baked inside flaky golden pastry crust.' },
  { name: 'Molten Choco Lava Cake', price: 110, desc: 'Warm personal chocolate cake with an irresistible flowing molten chocolate center.' },
  { name: 'Caramel Custard Pudding', price: 90, desc: 'Silky smooth baked egg and milk custard with golden liquid caramel sauce.' },
  { name: 'Panna Cotta with Mango', price: 110, desc: 'Silky Italian chilled cream dessert topped with fresh mango coulis.' },
  { name: 'Fruit Salad', price: 85, desc: 'Colorful medley of seasonal fresh cut fruits served with honey and mint.' },
  { name: 'Fruit Salad with Ice Cream', price: 110, desc: 'Fresh seasonal fruits topped with a scoop of creamy vanilla ice cream.' },
  { name: 'Nutella Waffle', price: 140, desc: 'Crisp Belgian waffle smothered in rich Nutella spread and chocolate pearls.' }
];

// Helper to expand arrays with systematic culinary variations to hit target counts
const expandVariations = (baseList, targetCount, category, isVeg, isHealth) => {
  const result = [...baseList];
  let idx = 0;
  const prefixes = ['Special', 'Deluxe', 'Royal', 'Chef Special', 'Homestyle', 'Grand', 'Classic', 'Signature', 'Artisan', 'Premium'];
  const preparationStyles = [
    'with Roasted Cumin', 'with Golden Ghee', 'with Cashews & Raisins', 'with Mint Chutney',
    'Tawa Roasted', 'Clay Oven Baked', 'with Extra Herbs', 'Slow Simmered',
    'with Crispy Onion Garnish', 'Tempered in Desi Ghee', 'with Aromatic Garam Masala'
  ];

  while (result.length < targetCount) {
    const item = baseList[idx % baseList.length];
    const prefix = prefixes[Math.floor(result.length / baseList.length) % prefixes.length];
    const style = preparationStyles[result.length % preparationStyles.length];
    
    const newName = `${prefix} ${item.name}`;
    // Check duplicate
    if (!result.some(r => r.name.toLowerCase() === newName.toLowerCase())) {
      result.push({
        name: newName,
        price: item.price + (Math.floor(Math.random() * 5) * 10),
        desc: `${item.desc} Prepared ${style.toLowerCase()} for enhanced flavor and aroma.`
      });
    }
    idx++;
  }
  return result.slice(0, targetCount);
};

// ── RECOMMENDED HEALTHY MENU FOODS (600 items) ────────────────────

const HEALTHY_COMBOS_BASE = [
  // Diabetic-Friendly Bowls & Thalis (45)
  { name: 'Foxtail Millet Khichdi', price: 160, desc: 'Low-glycemic foxtail millet and split moong dal cooked with cumin, ginger, and turmeric.' },
  { name: 'Ragi Mudde with Sambar', price: 140, desc: 'Traditional steamed finger millet balls rich in calcium, served with nutrient-dense vegetable sambar.' },
  { name: 'Bitter Gourd Crispy Baked Chips', price: 120, desc: 'Air-baked karela slices seasoned with chaat masala and rock salt; aids insulin regulation.' },
  { name: 'Methi Thepla with Low-Fat Curd', price: 130, desc: 'Fenugreek-infused whole wheat flatbreads served with probiotic non-fat curd.' },
  { name: 'Diabetic Care Brown Rice Thali', price: 190, desc: 'Brown rice, palak dal, steamed bitter gourd sabzi, cucumber salad, and buttermilk.' },
  { name: 'Quinoa Pongal with Pepper', price: 170, desc: 'South Indian style savory pongal made with whole quinoa, cumin, black pepper, and ginger.' },
  { name: 'Steel-Cut Oats Upma with Veggies', price: 140, desc: 'High-fiber steel-cut oats tempered with mustard seeds, curry leaves, carrots, and peas.' },
  { name: 'Little Millet Curd Rice', price: 130, desc: 'Low-GI Samai millet mixed with skimmed curd and topped with antioxidant pomegranate seeds.' },
  { name: 'Kodo Millet Pulao with Mint', price: 160, desc: 'Mineral-dense Kodo millet cooked with garden mint, beans, carrots, and warm spices.' },
  { name: 'Barley Vegetable Broth', price: 120, desc: 'Whole pearl barley simmered with root vegetables and aromatic herbs for blood sugar control.' },
  { name: 'Broccoli Paneer Tawa Stir-Fry', price: 180, desc: 'Crisp broccoli florets and low-fat cottage cheese tossed with roasted cumin and garlic.' },
  { name: 'Palak Tofu Bhurji', price: 160, desc: 'Iron-rich spinach and scrambled non-GMO tofu sautéed with onions, tomatoes, and turmeric.' },
  { name: 'Sprouted Moong Salad', price: 110, desc: 'Live sprouted green gram tossed with lemon juice, diced cucumber, tomatoes, and ground flaxseeds.' },
  { name: 'Methi Moong Dal with Bajra Roti', price: 150, desc: 'Fresh fenugreek leaves in yellow lentils paired with high-fiber pearl millet flatbread.' },
  { name: 'Roasted Chana & Cucumber Chaat', price: 100, desc: 'Protein-packed roasted Bengal gram mixed with diced cucumber, lime, and pink salt.' },
  { name: 'Green Moong Dosa (Pesarattu)', price: 130, desc: 'Whole green gram crepe packed with fiber and protein, served with ginger chutney.' },
  { name: 'Steamed Cabbage Rolls', price: 140, desc: 'Tender cabbage leaves stuffed with spiced lentil and vegetable crumble, steamed to perfection.' },
  { name: 'Okra Stir-Fry with Amaranth Roti', price: 150, desc: 'Mucilage-rich lady finger sautéed in minimal mustard oil, served with gluten-free rajgira roti.' },
  { name: 'Fenugreek Seed Sprout Salad', price: 120, desc: 'Mildly bitter sprouted methi seeds tossed with sweet grated carrots and lemon.' },
  { name: 'Cinnamon Infused Barley Water', price: 80, desc: 'Steeped pearl barley drink flavored with Ceylon cinnamon to enhance insulin sensitivity.' },
  { name: 'Roasted Flaxseed Millet Khichdi', price: 160, desc: 'Barnyard millet cooked with split yellow lentils and omega-3 rich roasted flax powder.' },
  { name: 'Chia & Almond Milk Diabetic Pudding', price: 150, desc: 'Unsweetened chia seed pudding steeped in homemade almond milk with raw cinnamon.' },
  { name: 'Zucchini Bell Pepper Saute with Brown Rice', price: 160, desc: 'Low-carb zucchini, red and yellow bell peppers tossed in olive oil over brown rice.' },
  { name: 'Soya Chunk Matar with Jowar Roti', price: 160, desc: 'High-protein defatted soya chunks and green peas curry with sorghum flatbread.' },
  { name: 'Pumpkin & Flaxseed Soup', price: 130, desc: 'Creamy roasted pumpkin puree enriched with crushed flaxseeds and thyme.' },
  { name: 'Baked Bitter Gourd Rings', price: 110, desc: 'Thin karela rings baked crisp with turmeric, amchur, and roasted cumin.' },
  { name: 'Turmeric Garlic Lentil Soup', price: 120, desc: 'Warm yellow lentils infused with fresh crushed raw turmeric and anti-inflammatory garlic.' },
  { name: 'Steamed Sprout Idlis', price: 120, desc: 'Fermented brown rice and sprouted moong batter steamed into fluffy idlis with mint chutney.' },
  { name: 'Diabetic Super Seed Trail Mix', price: 140, desc: 'Dry roasted pumpkin, watermelon, chia, and sunflower seeds with roasted makhana.' },
  { name: 'Ragi Vermicelli Upma', price: 120, desc: 'Finger millet vermicelli tempered with mustard seeds, green chillies, and curry leaves.' },
  { name: 'Drumstick Leaves Soup', price: 110, desc: 'Nutrient-packed moringa leaf clear soup seasoned with black pepper and cumin.' },
  { name: 'Bitter Gourd Subzi with Phulka', price: 130, desc: 'Caramelized onion and bitter gourd dry sabzi served with two oil-free whole wheat phulkas.' },
  { name: 'Bottle Gourd Soup with Jeera', price: 110, desc: 'Hydrating lauki soup lightly seasoned with dry roasted cumin and pink salt.' },
  { name: 'Green Apple & Spinach Diabetic Smoothie', price: 140, desc: 'Low-glycemic green apple blended with tender spinach, chia seeds, and water.' },
  { name: 'Steamed French Beans & Carrot Poriyal', price: 110, desc: 'South Indian style steamed vegetables with mustard seeds and grated coconut.' },
  { name: 'Multi-Millet Idli with Coriander Chutney', price: 120, desc: 'Steamed cakes made from ragi, foxtail, and kodo millets with fresh herb dip.' },
  { name: 'Cauliflower Broccoli Herb Stir-Fry', price: 150, desc: 'Cruciferous vegetables sautéed with cold-pressed olive oil, garlic, and fresh herbs.' },
  { name: 'Wheat Bran & Oats Porridge', price: 120, desc: 'High-fiber coarse bran and oats boiled in almond milk with ground cinnamon.' },
  { name: 'Raw Papaya & Sprout Salad', price: 120, desc: 'Julienned raw green papaya and sprouted green gram with lime-chili dressing.' },
  { name: 'Roasted Makhana with Rock Salt', price: 100, desc: 'Fox nuts roasted in olive oil with pink Himalayan salt and turmeric.' },
  { name: 'Black Gram Lentil Sundal', price: 100, desc: 'Boiled black urad dal tempered with mustard, red chillies, and fresh coconut.' },
  { name: 'Steamed Mixed Sprout Chaat', price: 110, desc: 'Warm steamed mixed bean sprouts tossed with tomatoes, onions, and lemon.' },
  { name: 'Baked Methi Mathri with Green Tea', price: 110, desc: 'Crispy baked whole wheat and fenugreek crackers served with organic green tea.' },
  { name: 'Diabetic Herbal Green Tea Infusion', price: 70, desc: 'Brewed green tea with cinnamon bark, holy basil (tulsi), and dried ginger.' },
  { name: 'Steamed Bottle Gourd Kofta in Tomato Broth', price: 150, desc: 'Lauki dumplings steamed and served in a light tomato-cumin reduction.' },

  // Heart-Healthy & Low-Sodium Combos (45)
  { name: 'Heart-Care Steamed Sprout Medley', price: 140, desc: 'Steamed sprouts tossed with antioxidant-rich pomegranates, walnuts, and extra virgin olive oil.' },
  { name: 'Garlic Sautéed Spinach with Brown Rice', price: 150, desc: 'Fresh spinach wilted with golden garlic cloves and served over steamed brown rice.' },
  { name: 'Low-Sodium Steamed Brown Rice Idlis', price: 110, desc: 'Salt-free steamed brown rice cakes accompanied by low-sodium vegetable stew.' },
  { name: 'Oats Pongal with Black Pepper', price: 130, desc: 'Heart-healthy rolled oats and moong dal simmered with black pepper, ginger, and curry leaves.' },
  { name: 'Walnut & Pomegranate Superfood Salad', price: 160, desc: 'Crisp greens, California walnuts, juicy pomegranates, and extra virgin olive oil.' },
  { name: 'Steamed Beetroot Poriyal with Curd', price: 120, desc: 'Nitrate-rich grated beetroot steamed with mustard tempering and served with probiotic curd.' },
  { name: 'Zero-Oil Vegetable Stew with Brown Appam', price: 160, desc: 'Kerala style vegetable stew simmered in coconut milk without added oil, with brown rice appam.' },
  { name: 'Low-Sodium Moong Dal Khichdi', price: 120, desc: 'Mild split yellow lentils and rice tempered with cumin seeds and fresh ginger.' },
  { name: 'Flaxseed Enriched Multigrain Thali', price: 180, desc: 'Heart-care platter featuring flaxseed rotis, steamed dal, sautéed greens, and kachumber.' },
  { name: 'Olive Oil Roasted Asparagus & Mushrooms', price: 180, desc: 'Fresh asparagus spears and button mushrooms roasted with cracked pepper and sea salt.' },
  { name: 'Steamed Mixed Vegetables with Lemon', price: 120, desc: 'Broccoli, carrots, beans, and peas steamed crisp and drizzled with fresh lemon juice.' },
  { name: 'Tomato Basil Garlic Broth with Toast', price: 130, desc: 'Antioxidant-rich lycopene tomato broth simmered with garlic and fresh basil.' },
  { name: 'Low-Sodium Yellow Lentil Soup', price: 110, desc: 'Light yellow lentils cooked with roasted cumin, turmeric, and fresh cilantro.' },
  { name: 'Steamed Edamame with Pink Salt', price: 150, desc: 'Young green soybeans in pods, steamed tender and sprinkled with mineral-rich pink salt.' },
  { name: 'Grilled Tofu with Steamed Broccoli', price: 170, desc: 'Organic firm tofu grilled with mild herbs, paired with crunchy steamed broccoli.' },
  { name: 'Quinoa Vegetable Medley with Olive Oil', price: 160, desc: 'Tri-color quinoa tossed with bell peppers, zucchini, and cold-pressed olive oil.' },
  { name: 'Heart-Care Green Smoothie', price: 130, desc: 'Cardio-protective blend of celery, spinach, green apple, cucumber, and flaxseeds.' },
  { name: 'Almond & Flaxseed Porridge with Blueberries', price: 150, desc: 'Rolled oats simmered in almond milk, topped with flaxseeds and fresh blueberries.' },
  { name: 'Steamed Lentil Dumplings', price: 110, desc: 'Steamed savory rice and lentil dumplings flavored with ginger and curry leaves.' },
  { name: 'Roasted Garlic White Bean Soup', price: 140, desc: 'Creamy cannellini beans pureed with roasted garlic and rosemary in olive oil.' },
  { name: 'Kale & Chickpea Low-Sodium Bowl', price: 160, desc: 'Sautéed curly kale, boiled chickpeas, and roasted sweet potatoes with tahini dressing.' },
  { name: 'Steamed Pumpkin & Carrot Mash', price: 110, desc: 'Carotenoid-rich sweet pumpkin and carrots mashed with black pepper and nutmeg.' },
  { name: 'Zucchini & Bell Pepper Warm Salad', price: 140, desc: 'Ribbons of green zucchini and sweet bell peppers tossed in warm garlic oil.' },
  { name: 'Cucumber Mint Low-Sodium Raita with Roti', price: 120, desc: 'Cooling grated cucumber raita without added salt, served with two whole wheat rotis.' },
  { name: 'Brown Rice with Garlic Tomato Rasam', price: 120, desc: 'Steamed brown rice served with therapeutic black pepper and garlic rasam.' },
  { name: 'Steamed Ridge Gourd with Moong Dal', price: 130, desc: 'Digestive peerkangai kootu cooked with yellow split lentils and mild cumin.' },
  { name: 'Steamed Radish & Greens with Mustard', price: 110, desc: 'White radish and tender radish leaves steamed with mustard seeds and turmeric.' },
  { name: 'Steamed Green Beans with Sesame', price: 110, desc: 'French beans tossed with toasted white sesame seeds and lemon juice.' },
  { name: 'Low-Sodium Lentil Sambhar with Foxtail Millet', price: 140, desc: 'Tangy vegetable sambhar made with minimal sodium, served over foxtail millet.' },
  { name: 'Safflower Seed & Vegetable Stir-Fry', price: 150, desc: 'Colorful garden vegetables stir-fried in heart-protective cold-pressed safflower oil.' },
  { name: 'Apple Cinnamon Overnight Oats', price: 130, desc: 'Rolled oats soaked overnight in skimmed milk with grated apple and Ceylon cinnamon.' },
  { name: 'Steamed Ivy Gourd with Cumin', price: 110, desc: 'Crisp tindora rounds sautéed with cumin seeds and mild turmeric.' },
  { name: 'Turmeric Ginger Heart Elixir', price: 80, desc: 'Warm steeped infusion of fresh turmeric root, ginger, black pepper, and lemon.' },
  { name: 'Celery Carrot Ginger Detox Juice', price: 90, desc: 'Fresh cold-pressed cardio-cleansing juice with zero added sugar or salt.' },
  { name: 'Baked Garlic Paneer Bites', price: 160, desc: 'Low-fat cottage cheese cubes rubbed with garlic paste and baked until golden.' },
  { name: 'Steamed Moong Dal Patties', price: 120, desc: 'Savory soaked moong dal patties steamed and served with fresh mint dip.' },
  { name: 'Low-Salt Beetroot Rasam with Millet', price: 130, desc: 'Antioxidant-dense beetroot broth with cumin, served with little millet.' },
  { name: 'Steamed Snake Gourd with Chana Dal', price: 120, desc: 'Hydrating snake gourd cooked with Bengal gram and curry leaves.' },
  { name: 'Chia Seed & Pomegranate Heart Tonic', price: 90, desc: 'Fresh pomegranate juice mixed with soaked chia seeds for endothelial health.' },
  { name: 'Roasted Sunflower & Pumpkin Seeds Bowl', price: 120, desc: 'Oven-roasted unsalted seeds packed with natural vitamin E and magnesium.' },
  { name: 'Fresh Papaya Bowl with Mint & Chia', price: 100, desc: 'Cubed ripe papaya tossed with torn garden mint and soaked chia seeds.' },
  { name: 'Sprouted Fenugreek & Pomegranate Cups', price: 110, desc: 'Sprouted methi seeds combined with sweet pomegranate seeds and lime.' },
  { name: 'Cardamom Infused Almond Milk', price: 90, desc: 'Warm homemade almond milk lightly flavored with green cardamom.' },
  { name: 'Green Tea with Holy Basil', price: 65, desc: 'Steeped whole green tea leaves with adaptogenic tulsi leaves.' },
  { name: 'Warm Lemon Water with Honey & Chia', price: 60, desc: 'Gentle morning cleanser with warm water, fresh lemon, raw honey, and chia seeds.' },

  // Superfood, Gut Health, Keto & Clean Eating (60)
  { name: 'Quinoa Avocado Buddha Bowl', price: 190, desc: 'Organic tri-color quinoa, sliced ripe avocado, roasted chickpeas, purple cabbage, and tahini.' },
  { name: 'Greek Yogurt Bowl with Honey & Walnuts', price: 160, desc: 'Thick strained probiotic Greek yogurt topped with raw forest honey and toasted walnuts.' },
  { name: 'Kimchi Cauliflower Rice Bowl', price: 170, desc: 'Spiced fermented gut-healthy kimchi tossed with riced cauliflower, edamame, and sesame.' },
  { name: 'Kombucha Chia Seed Pudding', price: 150, desc: 'Chia seeds bloomed in probiotic kombucha with blueberries and mint.' },
  { name: 'Miso Soup with Tofu & Wakame', price: 140, desc: 'Fermented soybean paste broth with silken tofu cubes and sea greens.' },
  { name: 'Sourdough Toast with Avocado & Kraut', price: 160, desc: 'Naturally fermented sourdough slice with mashed avocado and lacto-fermented kraut.' },
  { name: 'Tempeh Buddha Bowl', price: 180, desc: 'Probiotic fermented soybean tempeh, quinoa, steamed broccoli, and ginger-tahini dressing.' },
  { name: 'Keto Cauliflower Mash with Garlic', price: 140, desc: 'Steamed cauliflower whipped with roasted garlic, cream, and olive oil; zero carb.' },
  { name: 'Zucchini Noodles in Basil Pesto', price: 170, desc: 'Spiralized zucchini noodles tossed in fresh pine nut and basil extra virgin olive oil pesto.' },
  { name: 'Keto Palak Paneer with Cauliflower Rice', price: 190, desc: 'Rich spinach puree and paneer paired with riced cauliflower for ultra-low carb dining.' },
  { name: 'Paneer Tikka Skewers (Keto)', price: 180, desc: 'Full-fat cottage cheese skewers marinated in curd and tandoori spices, zero added flour.' },
  { name: 'Grilled Cottage Cheese with Asparagus', price: 190, desc: 'Charred paneer steak served over grilled asparagus and cherry tomatoes.' },
  { name: 'Coconut Milk Mushroom Soup', price: 150, desc: 'Creamy button mushrooms simmered in thick coconut milk, lemongrass, and galangal.' },
  { name: 'Almond Flour Keto Roti with Paneer', price: 180, desc: 'Grain-free almond flour flatbreads served with spiced scrambled cottage cheese.' },
  { name: 'Keto Greek Salad with Feta', price: 160, desc: 'Crisp cucumbers, ripe tomatoes, Kalamata olives, and Greek feta cheese in olive oil.' },
  { name: 'Acai Berry Antioxidant Smoothie Bowl', price: 210, desc: 'Wild frozen acai blended with berries, topped with chia, pumpkin seeds, and coconut flakes.' },
  { name: 'Moringa Leaf Lentil Superfood Stew', price: 140, desc: 'Fresh moringa drumstick leaves simmered with yellow lentils and garlic.' },
  { name: 'Hemp Seed & Avocado Grain Bowl', price: 190, desc: 'Complete plant protein hemp hearts over red quinoa, sliced avocado, and baby greens.' },
  { name: 'Matcha Green Tea Chia Pudding', price: 150, desc: 'Ceremonial Japanese matcha whisked into almond milk with chia seeds.' },
  { name: 'Spirulina Green Power Smoothie Bowl', price: 180, desc: 'Nutrient-rich spirulina algae blended with banana, spinach, and coconut milk.' },
  { name: 'Clear Vegetable Detox Broth', price: 110, desc: 'Purifying clear broth simmered with celery, cabbage, carrots, and fresh herbs.' },
  { name: 'Lemon Coriander Soup', price: 110, desc: 'Zero-oil restorative clear broth infused with lemon juice and fresh coriander stems.' },
  { name: 'Pomegranate Arugula Detox Salad', price: 150, desc: 'Peppery wild baby arugula tossed with pomegranate jewels, walnuts, and lemon vinaigrette.' },
  { name: 'Wheatgrass Detox Shot', price: 70, desc: 'Freshly cold-pressed wheatgrass juice shot with a drop of ginger and lemon.' },
  { name: 'Ash Gourd Detox Juice', price: 70, desc: 'Raw winter melon juice known in Ayurveda for deep cellular alkalinity and cooling.' },
  { name: 'Balanced 400-Calorie High-Fiber Thali', price: 180, desc: 'Measured nutrition: brown rice, spinach dal, roasted vegetables, kachumber, and chaas.' },
  { name: 'Quinoa Lentil Protein Plate', price: 170, desc: 'Complete amino acid profile: tri-color quinoa, sprouted green gram curry, and cucumber.' },
  { name: 'Tofu Broccoli Brown Rice Protein Plate', price: 180, desc: 'Pan-seared non-GMO tofu, steamed broccoli florets, and brown basmati rice.' },
  { name: 'Sweet Potato & Chickpea Balanced Bowl', price: 160, desc: 'Roasted sweet potato cubes, boiled chickpeas, baby spinach, and lemon tahini dressing.' },
  { name: 'Multi-Grain Dosa with Flaxseed Podi', price: 130, desc: 'Lentil, oats, and ragi crepe dusted with omega-3 rich roasted flaxseed chutney powder.' }
];

const GYM_COMBOS_BASE = [
  // Lean Poultry & Chicken Breast Power Meals (40)
  { name: 'Grilled Herb Chicken Breast', price: 240, desc: '200g tender lean chicken breast marinated in rosemary, thyme, garlic, and olive oil with sweet potato.' },
  { name: 'Lemon Pepper Chicken Breast', price: 240, desc: 'Pan-seared chicken breast seasoned with crushed black peppercorns and fresh lemon, served with broccoli.' },
  { name: 'Teriyaki Chicken Rice Bowl', price: 250, desc: 'Grilled chicken breast glazed with low-sodium teriyaki sauce over steamed brown rice and snap peas.' },
  { name: 'Peri Peri Grilled Chicken Breast', price: 240, desc: 'Fiery bird eye chili marinated chicken breast grilled tender, served with roasted vegetables.' },
  { name: 'Herb-Roasted Chicken with Asparagus', price: 260, desc: 'Juicy roasted chicken breast paired with steamed asparagus spears and baby carrots.' },
  { name: 'Chicken Breast Quinoa Power Bowl', price: 260, desc: 'Diced grilled chicken breast, fluffy quinoa, cherry tomatoes, cucumbers, and lemon dressing.' },
  { name: 'Garlic Rosemary Chicken Breast', price: 240, desc: 'Aromatic garlic and fresh rosemary infused chicken breast with sautéed green beans.' },
  { name: 'Spicy Tandoori Chicken Breast Strips', price: 230, desc: 'Clay oven roasted skinless chicken breast strips marinated in hung curd and tandoori spices.' },
  { name: 'Blackened Chicken with Avocado Salad', price: 270, desc: 'Cajun rubbed chicken breast seared crisp, served with sliced avocado and mixed greens.' },
  { name: 'Cajun Spiced Chicken Breast', price: 240, desc: 'Bold Louisiana spiced grilled chicken breast with roasted sweet potato wedges.' },
  { name: 'Steamed Shredded Chicken Breast Salad', price: 220, desc: 'Clean steamed chicken breast tossed with shredded cabbage, carrots, and sesame-lime dressing.' },
  { name: 'BBQ Glazed Chicken Breast', price: 240, desc: 'Tender chicken breast brushed with low-sugar smokey barbecue sauce, with corn and peas.' },
  { name: 'Smoked Chicken Breast with Spinach', price: 250, desc: 'Hardwood smoked lean chicken breast served over a generous bed of sautéed garlic spinach.' },
  { name: 'Asian Style Chili Chicken Breast', price: 240, desc: 'Wok-seared lean chicken breast with bell peppers, green chillies, and light soy over brown rice.' },
  { name: 'Chicken Breast Stir-Fry with Zucchini', price: 230, desc: 'Sliced chicken breast wok-tossed with zucchini, bell peppers, and toasted sesame seeds.' },
  { name: 'Baked Lemon Thyme Chicken Breast', price: 240, desc: 'Slow-baked tender chicken breast infused with fresh thyme, served with sweet potato mash.' },
  { name: 'Chicken Breast Fajita Bowl', price: 250, desc: 'Grilled chicken breast strips with sautéed fajita peppers, onions, black beans, and brown rice.' },
  { name: 'Honey Mustard Chicken Breast', price: 240, desc: 'Tangy-sweet Dijon mustard and raw honey marinated chicken breast with steamed broccoli.' },
  { name: 'Chipotle Chicken Burrito Bowl', price: 260, desc: 'Smoky chipotle grilled chicken breast with pinto beans, brown rice, pico de gallo, and lettuce.' },
  { name: 'Herb Marinated Chicken Skewers', price: 230, desc: 'Skewered lean chicken cubes grilled over hot coals, served with refreshing mint dip.' },
  { name: 'Moroccan Spiced Chicken Breast', price: 250, desc: 'Warm spices of cumin, coriander, and paprika rubbed chicken breast with steamed couscous.' },
  { name: 'Mediterranean Chicken Breast', price: 260, desc: 'Grilled chicken breast with Kalamata olives, cherry tomatoes, and cucumber salad.' },
  { name: 'Grilled Lemon Garlic Chicken Fillet', price: 240, desc: 'Simple, clean pan-seared chicken fillet with crushed garlic and fresh lemon juice.' },
  { name: 'Shredded Chicken Breast Soup', price: 180, desc: 'High-protein clear chicken broth loaded with 150g shredded chicken and vegetables.' },
  { name: 'Spicy Sriracha Chicken Breast', price: 240, desc: 'Hot sriracha glazed chicken breast served with steamed jasmine rice and cucumber.' },
  { name: 'Pepper Chicken Breast with Mushrooms', price: 250, desc: 'Crushed black pepper rubbed chicken breast served with pan-seared button mushrooms.' },
  { name: 'Lemon Herb Pulled Chicken', price: 230, desc: 'Slow-cooked juicy pulled chicken breast served with toasted multigrain bread.' },
  { name: 'Paprika Chicken Breast with Carrots', price: 240, desc: 'Smoked Spanish paprika spiced chicken breast with glazed baby carrots.' },
  { name: 'Rosemary Garlic Chicken Strips', price: 230, desc: 'Lean chicken breast strips sautéed in olive oil with rosemary and sea salt.' },
  { name: 'Grilled Chimichurri Chicken Breast', price: 260, desc: 'Tender chicken breast topped with fresh Argentine parsley and oregano chimichurri sauce.' },
  { name: 'Ginger Soy Chicken with Broccoli', price: 240, desc: 'Savory ginger and low-sodium soy glazed chicken breast with steamed broccoli.' },
  { name: 'Baked Buffalo Chicken Breast', price: 240, desc: 'Spicy cayenne pepper sauce baked chicken breast served with crunchy celery and yogurt dip.' },
  { name: 'Basil Pesto Chicken Breast', price: 260, desc: 'Grilled chicken breast smothered in homemade basil pesto, served with zucchini noodles.' },
  { name: 'Mustard Herb Crusted Chicken', price: 250, desc: 'Golden baked chicken breast with a savory wholegrain mustard and fresh herb crust.' },
  { name: 'Turmeric Spiced Lean Chicken Strips', price: 230, desc: 'Anti-inflammatory golden turmeric and cumin marinated chicken strips with brown rice.' },
  { name: 'Orange Ginger Glazed Chicken', price: 240, desc: 'Fresh orange juice and ginger reduction glazed chicken breast with steamed greens.' },
  { name: 'Tandoori Chicken Breast Salad', price: 240, desc: 'Smoky clay oven roasted chicken breast slices over mixed greens with mint-yogurt dressing.' },
  { name: 'Sautéed Chicken Strips with Snap Peas', price: 240, desc: 'Tender chicken strips and sweet crunchy sugar snap peas in light garlic sauce.' },
  { name: 'Clean Chicken Breast Tikka', price: 230, desc: 'Charcoal grilled skinless chicken breast cubes prepared with zero added butter.' },
  { name: 'Power Lifter 300g Chicken Feast', price: 320, desc: 'Massive 300g portion of grilled lean chicken breast with double sweet potato and greens.' },

  // High-Protein Egg Specials (35)
  { name: 'Egg White Scramble with Spinach', price: 140, desc: 'Six egg whites scrambled with fresh baby spinach, black pepper, and pink salt.' },
  { name: 'Boiled Egg Whites Snack Pack (6 eggs)', price: 90, desc: 'Six hard-boiled farm fresh egg whites sprinkled with black pepper and chaat masala.' },
  { name: 'Masala Egg White Bhurji', price: 140, desc: 'Six egg whites scrambled with onions, tomatoes, green chillies, served with multigrain toast.' },
  { name: 'Sunny Side Up Eggs on Sourdough', price: 130, desc: 'Three pasture-raised eggs pan-fried sunny side up on toasted artisan sourdough.' },
  { name: 'Spanish Egg White Omelette', price: 150, desc: 'Fluffy five-egg white omelette folded over sautéed mushrooms and bell peppers.' },
  { name: 'High-Protein Egg White Frittata', price: 160, desc: 'Oven-baked frittata made with six egg whites, spinach, zucchini, and feta cheese.' },
  { name: 'Boiled Egg Salad with Greek Yogurt', price: 140, desc: 'Four hard-boiled eggs chopped and tossed with high-protein Greek yogurt and chives.' },
  { name: 'Egg White Omelette with Cheddar', price: 160, desc: 'Five egg whites folded with sharp white cheddar and fresh garden herbs.' },
  { name: 'Spicy Shakshuka with Poached Eggs', price: 160, desc: 'Three whole eggs poached in a rich bell pepper and tomato stew, with multigrain bread.' },
  { name: 'Scrambled Eggs with Avocado', price: 160, desc: 'Three fluffy scrambled eggs served with half sliced avocado on multigrain toast.' },
  { name: 'Egg White Wrap with Chicken Breast', price: 190, desc: 'Thin whole wheat tortilla wrapped around egg whites, grilled chicken breast, and greens.' },
  { name: 'Deviled Eggs High-Protein Style', price: 130, desc: 'Four hard-boiled eggs stuffed with whipped yolk, Greek yogurt, mustard, and paprika.' },
  { name: 'Egg White Chive Scramble', price: 130, desc: 'Delicate egg whites scrambled with fresh green chives, served with grilled tomatoes.' },
  { name: 'Poached Eggs on Steamed Asparagus', price: 150, desc: 'Two poached farm eggs served over a bed of tender steamed asparagus spears.' },
  { name: 'Mexican Style Scrambled Eggs', price: 150, desc: 'Three eggs scrambled with black beans, diced tomatoes, cilantro, and jalapenos.' },
  { name: 'Egg White & Paneer High-Protein Scramble', price: 170, desc: 'Power duo: five egg whites scrambled with crumbled low-fat cottage cheese.' },
  { name: 'Smoked Salmon Egg White Omelette', price: 220, desc: 'Delicate egg white omelette stuffed with wild smoked salmon ribbons and dill.' },
  { name: 'Egg White Protein Pancakes', price: 150, desc: 'Fluffy flourless pancakes made from egg whites, oats, and whey protein with berries.' },
  { name: 'Hard Boiled Egg Cups with Guacamole', price: 140, desc: 'Four hard-boiled egg halves topped with house-made fresh guacamole.' },
  { name: 'Egg White Pepper Fry with Toast', price: 130, desc: 'Egg whites pan-tossed with fiery black pepper and onions, served with brown toast.' },
  { name: 'Baked Egg Muffins with Vegetables', price: 140, desc: 'Three savory egg muffins baked with bell peppers, spinach, and broccoli.' },
  { name: 'Soft Boiled Eggs with Mushrooms', price: 140, desc: 'Four jammy soft-boiled eggs served with pan-seared garlic button mushrooms.' },
  { name: 'Egg White Omelette with Turkey Bacon', price: 180, desc: 'Five egg whites folded with crispy lean turkey bacon and chives.' },
  { name: 'Cheesy Egg White Scramble with Broccoli', price: 150, desc: 'Egg whites scrambled with tender broccoli florets and melted cheddar.' },
  { name: 'Egg White Stir-Fry with Bell Peppers', price: 130, desc: 'Cube-cut steamed egg whites stir-fried with colorful bell peppers and soy sauce.' },
  { name: 'Zesty Herbed Egg White Salad', price: 130, desc: 'Six chopped egg whites tossed with parsley, dill, mustard, and lemon juice.' },
  { name: 'Egg White Crepe Stuffed with Chicken', price: 190, desc: 'Thin egg white crepe folded over seasoned shredded chicken breast and peppers.' },
  { name: 'Turkish Poached Eggs with Garlic Yogurt', price: 160, desc: 'Two poached eggs over thick garlic Greek yogurt, drizzled with warm chili olive oil.' },
  { name: 'Egg White Omelette with Feta', price: 150, desc: 'Five egg whites cooked with fresh baby spinach and crumbled tangy feta.' },
  { name: 'Sriracha Egg White Scramble', price: 140, desc: 'Fluffy egg whites drizzled with spicy sriracha sauce, served with sliced avocado.' },
  { name: 'Egg White Bhurji with Jowar Roti', price: 150, desc: 'Spiced Indian egg white scramble served with gluten-free sorghum flatbread.' },
  { name: 'Steamed Egg Custard High-Protein', price: 130, desc: 'Savory Asian style steamed egg whites with scallions and light sesame oil.' },
  { name: 'Egg White Scramble with Quinoa', price: 160, desc: 'High-protein bowl of fluffy egg whites over quinoa with fresh pico de gallo.' },
  { name: 'Hard Boiled Eggs with Peri Peri (6 eggs)', price: 95, desc: 'Six boiled farm eggs dusted with zesty African peri peri spice blend.' },
  { name: 'Power Lifter 8-Egg White Scramble', price: 170, desc: 'Colossal eight-egg white scramble with pink salt and cracked black pepper.' },

  // Wild Seafood, Shakes & Beef/Lamb (40)
  { name: 'Grilled Salmon with Steamed Asparagus', price: 340, desc: 'Fresh Norwegian salmon fillet grilled with lemon and dill, paired with steamed asparagus.' },
  { name: 'Pan-Seared Salmon with Sweet Potato', price: 350, desc: 'Rich omega-3 salmon fillet pan-seared crisp, served with mashed sweet potatoes.' },
  { name: 'Lemon Garlic Grilled Sea Bass', price: 320, desc: 'White sea bass fillet grilled in olive oil with garlic and lemon, with green beans.' },
  { name: 'Baked Cod Fillet with Vegetables', price: 290, desc: 'Lean Pacific cod baked tender with Mediterranean herbs, zucchini, and cherry tomatoes.' },
  { name: 'Grilled Tiger Prawns with Brown Rice', price: 290, desc: 'Eight jumbo tiger prawns skewered and grilled, served over steamed brown basmati rice.' },
  { name: 'Seared Ahi Tuna Steak', price: 340, desc: 'Sashimi-grade tuna steak crusted with sesame seeds and seared rare, with mixed greens.' },
  { name: 'Pan-Fried King Fish with Greens', price: 280, desc: 'Lean King Fish steak seasoned with coastal spices and pan-seared with minimal oil.' },
  { name: 'Tuna Salad Bowl with Olive Oil', price: 260, desc: 'Chunk light tuna tossed with crisp lettuce, cucumbers, cherry tomatoes, and extra virgin olive oil.' },
  { name: 'Cajun Grilled Salmon with Broccoli', price: 340, desc: 'Salmon fillet rubbed with smoky Cajun spices, served with tender steamed broccoli.' },
  { name: 'Shrimp Fajita Bowl with Brown Rice', price: 270, desc: 'Sautéed wild shrimp with fajita peppers, onions, black beans, and brown rice.' },
  { name: 'Tofu & Tempeh Protein Scramble', price: 180, desc: 'High-protein vegan scramble combining organic tofu and fermented tempeh with turmeric.' },
  { name: 'Grilled Tofu Steaks with Quinoa', price: 190, desc: 'Marinated extra-firm tofu steaks grilled golden, served over fluffy tri-color quinoa.' },
  { name: 'Edamame Chickpea Power Bowl', price: 180, desc: '30g plant protein bowl with steamed edamame, boiled chickpeas, and lemon-tahini dressing.' },
  { name: 'Soya Chunk Stir-Fry with Brown Rice', price: 170, desc: 'High-protein textured soy chunks wok-tossed with peppers and served with brown rice.' },
  { name: 'Lentil & Quinoa Protein Power Plate', price: 170, desc: 'Complete plant amino acid profile: sprouted lentils, tri-color quinoa, and greens.' },
  { name: 'Double Chocolate Whey Isolate Shake', price: 170, desc: '30g ultra-filtered pure whey protein isolate blended with cold water or skimmed milk.' },
  { name: 'Vanilla Bean Whey Protein Shake', price: 170, desc: 'Smooth vanilla whey protein isolate shake blended with unsweetened almond milk.' },
  { name: 'Peanut Butter Banana Protein Shake', price: 190, desc: 'Whey protein blended with all-natural peanut butter, half banana, and almond milk.' },
  { name: 'Strawberry Whey Protein Smoothie', price: 180, desc: 'Fresh strawberries and whey protein isolate blended with antioxidant chia seeds.' },
  { name: 'Cookies & Cream Whey Isolate Shake', price: 180, desc: 'Rich whey isolate shake with real crushed dark cookie crumbs and ice.' },
  { name: 'Mocha Espresso Whey Protein Shake', price: 180, desc: 'Morning fuel: fresh espresso shot blended with chocolate whey protein and ice.' },
  { name: 'Salted Caramel Whey Protein Shake', price: 180, desc: 'Whey protein shake infused with natural salted caramel flavor and rolled oats.' },
  { name: 'Mixed Berry Whey Smoothie', price: 190, desc: 'Blueberries, raspberries, and blackberries blended with vanilla whey protein.' },
  { name: 'Green Superfood Whey Protein Shake', price: 190, desc: 'Vanilla whey protein blended with spinach, green apple, spirulina, and coconut water.' },
  { name: 'Ultimate 50g Post-Workout Recovery Shake', price: 230, desc: 'Dual scoop whey isolate with creatine, glutamine, banana, and oat milk for rapid muscle recovery.' },
  { name: 'Lean Beef Strips with Broccoli', price: 310, desc: 'Lean beef sirloin strips stir-fried with crisp broccoli florets in light garlic-soy.' },
  { name: 'Grilled Tenderloin Steak with Sweet Potato', price: 360, desc: '200g lean beef tenderloin steak grilled to medium, served with baked sweet potato.' },
  { name: 'Chimichurri Lean Beef with Brown Rice', price: 320, desc: 'Grilled lean beef slices topped with vibrant Argentine herb chimichurri over brown rice.' },
  { name: 'Garlic Butter Steak Bites with Asparagus', price: 330, desc: 'Tenderloin beef cubes seared in garlic olive oil, served with steamed asparagus.' },
  { name: 'Lean Ground Beef Rice Bowl', price: 290, desc: '95% lean ground beef cooked with Mexican spices, served over brown rice and avocado.' },
  { name: 'Grilled Lamb Chops with Mint Greens', price: 340, desc: 'Three lean lamb chops grilled over charcoal, served with fresh mint salad.' },
  { name: 'Herb Crusted Lean Lamb Loin', price: 340, desc: 'Rosemary and thyme crusted roasted lean lamb loin with roasted baby vegetables.' },
  { name: 'Clean Mass Gainer Double Protein Bowl', price: 350, desc: 'Grilled chicken breast and lean beef over double brown rice with avocado and salsa.' },
  { name: 'Beef & Broccoli Stir-Fry in Soy Garlic', price: 310, desc: 'Thinly sliced lean beef and broccoli in low-sodium garlic-ginger sauce.' },
  { name: 'Monster Mass 60g Protein Platter', price: 380, desc: 'Steak tenderloin, grilled chicken breast, four boiled egg whites, and sweet potato.' }
];

console.log('Generating expansive 1100+ foods database...');

const commonVeg = expandVariations(COMMON_VEG, 220, 'Veg', true, false);
const commonNonVeg = expandVariations(COMMON_NON_VEG, 200, 'Non-Veg', false, false);
const commonDrinks = expandVariations(COMMON_DRINKS, 50, 'Drinks', true, false);
const commonCoffee = expandVariations(COMMON_COFFEE, 40, 'Coffee', true, false);
const commonDessert = expandVariations(COMMON_DESSERT, 50, 'Ice Creams & Dessert', true, false);

const healthyCombos = expandVariations(HEALTHY_COMBOS_BASE, 340, 'Healthy Combo', true, true);
const gymCombos = expandVariations(GYM_COMBOS_BASE, 260, 'Gym Combo', false, true);

console.log(`Generated counts:
  Common Veg: ${commonVeg.length}
  Common Non-Veg: ${commonNonVeg.length}
  Common Drinks: ${commonDrinks.length}
  Common Coffee: ${commonCoffee.length}
  Common Dessert: ${commonDessert.length}
  Subtotal Common Menu: ${commonVeg.length + commonNonVeg.length + commonDrinks.length + commonCoffee.length + commonDessert.length}

  Healthy Combos: ${healthyCombos.length}
  Gym Combos: ${gymCombos.length}
  Subtotal Recommended Menu: ${healthyCombos.length + gymCombos.length}
`);

// Macro calculators
const calcMacros = (item, category, isHealthy) => {
  const name = item.name.toLowerCase();
  let calories = 350;
  let protein = 12;
  let carbs = 45;
  let fat = 10;
  let sugar = 4;
  let sodium = 300;
  let dietaryTags = [];
  let healthTags = [];

  if (category === 'Gym Combo') {
    if (name.includes('chicken') || name.includes('poultry')) {
      calories = 360 + Math.floor(Math.random() * 80);
      protein = 38 + Math.floor(Math.random() * 15);
      carbs = 15 + Math.floor(Math.random() * 20);
      fat = 6 + Math.floor(Math.random() * 5);
      sugar = 2;
      sodium = 280;
      dietaryTags = ['High-Protein', 'Low-Carb'];
      healthTags = ['HIGH_PROTEIN', 'FITNESS_CARE'];
    } else if (name.includes('egg')) {
      calories = 220 + Math.floor(Math.random() * 60);
      protein = 28 + Math.floor(Math.random() * 12);
      carbs = 8 + Math.floor(Math.random() * 10);
      fat = 5 + Math.floor(Math.random() * 5);
      sugar = 1;
      sodium = 240;
      dietaryTags = ['High-Protein', 'Low-Carb'];
      healthTags = ['HIGH_PROTEIN', 'KETO'];
    } else if (name.includes('salmon') || name.includes('fish') || name.includes('prawn') || name.includes('tuna')) {
      calories = 320 + Math.floor(Math.random() * 80);
      protein = 34 + Math.floor(Math.random() * 12);
      carbs = 10 + Math.floor(Math.random() * 15);
      fat = 9 + Math.floor(Math.random() * 6);
      sugar = 1;
      sodium = 260;
      dietaryTags = ['High-Protein', 'Gluten-Free'];
      healthTags = ['HIGH_PROTEIN', 'HEART_HEALTHY'];
    } else if (name.includes('shake') || name.includes('smoothie')) {
      calories = 250 + Math.floor(Math.random() * 70);
      protein = 32 + Math.floor(Math.random() * 18);
      carbs = 18 + Math.floor(Math.random() * 15);
      fat = 3 + Math.floor(Math.random() * 4);
      sugar = 4;
      sodium = 180;
      dietaryTags = ['High-Protein', 'Vegetarian'];
      healthTags = ['HIGH_PROTEIN', 'POST_WORKOUT'];
    } else {
      calories = 420 + Math.floor(Math.random() * 90);
      protein = 40 + Math.floor(Math.random() * 15);
      carbs = 20 + Math.floor(Math.random() * 20);
      fat = 12 + Math.floor(Math.random() * 8);
      sugar = 2;
      sodium = 320;
      dietaryTags = ['High-Protein'];
      healthTags = ['HIGH_PROTEIN', 'MUSCLE_GAIN'];
    }
  } else if (category === 'Healthy Combo') {
    calories = 260 + Math.floor(Math.random() * 120);
    protein = 14 + Math.floor(Math.random() * 12);
    carbs = 35 + Math.floor(Math.random() * 25);
    fat = 5 + Math.floor(Math.random() * 6);
    sugar = 3;
    sodium = 190;

    if (name.includes('millet') || name.includes('ragi') || name.includes('bitter') || name.includes('diabetic')) {
      dietaryTags = ['Low-Carb', 'Vegan', 'Gluten-Free'];
      healthTags = ['DIABETIC_FRIENDLY', 'LOW_GI'];
    } else if (name.includes('heart') || name.includes('garlic') || name.includes('sprout') || name.includes('beetroot')) {
      dietaryTags = ['Low-Carb', 'Gluten-Free'];
      healthTags = ['HEART_HEALTHY', 'LOW_SODIUM'];
    } else if (name.includes('keto') || name.includes('cauliflower') || name.includes('zucchini')) {
      dietaryTags = ['Low-Carb', 'Gluten-Free'];
      healthTags = ['KETO', 'LOW_CARB'];
      carbs = 8 + Math.floor(Math.random() * 8);
      fat = 14 + Math.floor(Math.random() * 6);
    } else {
      dietaryTags = ['High-Protein', 'Vegan'];
      healthTags = ['CLEAN_EATING', 'SUPERFOOD'];
    }
  } else if (category === 'Drinks') {
    calories = 110 + Math.floor(Math.random() * 90);
    protein = 2 + Math.floor(Math.random() * 4);
    carbs = 24 + Math.floor(Math.random() * 18);
    fat = 1 + Math.floor(Math.random() * 3);
    sugar = 16 + Math.floor(Math.random() * 12);
    sodium = 60;
  } else if (category === 'Coffee') {
    calories = 80 + Math.floor(Math.random() * 110);
    protein = 3 + Math.floor(Math.random() * 4);
    carbs = 10 + Math.floor(Math.random() * 16);
    fat = 3 + Math.floor(Math.random() * 5);
    sugar = 8 + Math.floor(Math.random() * 10);
    sodium = 70;
  } else if (category === 'Ice Creams & Dessert') {
    calories = 280 + Math.floor(Math.random() * 160);
    protein = 5 + Math.floor(Math.random() * 4);
    carbs = 48 + Math.floor(Math.random() * 25);
    fat = 12 + Math.floor(Math.random() * 10);
    sugar = 32 + Math.floor(Math.random() * 20);
    sodium = 140;
  } else if (category === 'Non-Veg') {
    calories = 380 + Math.floor(Math.random() * 160);
    protein = 24 + Math.floor(Math.random() * 16);
    carbs = 28 + Math.floor(Math.random() * 30);
    fat = 16 + Math.floor(Math.random() * 12);
    sugar = 3;
    sodium = 480;
    dietaryTags = ['High-Protein'];
  } else {
    // Veg
    calories = 290 + Math.floor(Math.random() * 130);
    protein = 9 + Math.floor(Math.random() * 8);
    carbs = 42 + Math.floor(Math.random() * 24);
    fat = 10 + Math.floor(Math.random() * 8);
    sugar = 4;
    sodium = 360;
    dietaryTags = ['Vegetarian'];
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    sugar,
    sodium,
    dietaryTags,
    healthTags
  };
};

const compileItems = (list, category, isHealthy) => {
  return list.map((item) => {
    const isVeg = isFoodVeg(category, item.name);
    const macros = calcMacros(item, category, isHealthy);
    const slug = getSlug(item.name);
    return {
      name: item.name,
      description: item.desc,
      price: item.price,
      category,
      image: `/uploads/foods/${slug}.webp`,
      available: true,
      stock: 80 + Math.floor(Math.random() * 70),
      isVegetarian: isVeg,
      isRecommendedForHealth: isHealthy,
      rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
      reviewsCount: 15 + Math.floor(Math.random() * 150),
      nutritionalInfo: {
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        sugar: macros.sugar,
        sodium: macros.sodium
      },
      dietaryTags: macros.dietaryTags,
      healthTags: macros.healthTags
    };
  });
};

const allCompiledFoods = [
  ...compileItems(commonVeg, 'Veg', false),
  ...compileItems(commonNonVeg, 'Non-Veg', false),
  ...compileItems(commonDrinks, 'Drinks', false),
  ...compileItems(commonCoffee, 'Coffee', false),
  ...compileItems(commonDessert, 'Ice Creams & Dessert', false),
  ...compileItems(healthyCombos, 'Healthy Combo', true),
  ...compileItems(gymCombos, 'Gym Combo', true)
];

console.log(`\n✅ Total foods generated: ${allCompiledFoods.length}`);
console.log(`   Common Menu foods: ${allCompiledFoods.filter(f => !f.isRecommendedForHealth).length}`);
console.log(`   Recommended Healthy foods: ${allCompiledFoods.filter(f => f.isRecommendedForHealth).length}`);

// Ensure data folder exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const outputPath = path.join(dataDir, 'allFoods.json');
fs.writeFileSync(outputPath, JSON.stringify(allCompiledFoods, null, 2), 'utf-8');
console.log(`Saved compiled foods to ${outputPath}`);
