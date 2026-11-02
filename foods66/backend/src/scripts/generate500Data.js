// Generator script to produce backend/src/data/foods500Data.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define raw items for each category
const vegItems = [
  // Dosas & Crepes
  ['Masala Dosa', 'Crispy fermented rice and lentil crepe stuffed with spiced potato masala and served with chutneys and sambar.', 90, 320, 6, 52, 10, 4, 380, ['Vegetarian'], []],
  ['Ghee Roast Dosa', 'Crisp golden dosa generously roasted in pure desi ghee, served with coconut and tomato chutneys.', 120, 380, 5, 48, 18, 3, 350, ['Vegetarian'], []],
  ['Onion Rava Dosa', 'Crispy semolina crepe studded with chopped onions, green chillies, and cumin seeds.', 105, 340, 6, 54, 11, 4, 410, ['Vegetarian'], []],
  ['Mysore Masala Dosa', 'Classic dosa smeared with spicy red garlic-chilli chutney and filled with flavorful potato bhaji.', 115, 350, 7, 50, 14, 5, 430, ['Vegetarian'], []],
  ['Paper Plain Dosa', 'Ultra-thin, crispy, wafer-like dosa roasted to perfection, accompanied by freshly ground chutneys.', 85, 260, 5, 44, 7, 2, 320, ['Vegetarian', 'Low-Calorie'], []],
  ['Cheese Burst Dosa', 'Fusion dosa overloaded with melted mozzarella and cheddar cheese, sweet corn, and herbs.', 145, 460, 14, 46, 24, 4, 520, ['Vegetarian'], ['HIGH_FAT']],
  ['Podi Dosa', 'Crispy dosa coated with spicy gun powder (karam podi) and drenched in fragrant sesame oil.', 100, 330, 6, 48, 13, 3, 390, ['Vegetarian'], []],
  ['Schezwan Dosa', 'Indo-Chinese twist featuring shredded vegetables and fiery Schezwan sauce wrapped in a hot crepe.', 125, 360, 7, 56, 12, 6, 510, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Set Dosa with Saagu', 'Trio of sponge-soft, fluffy dosas served with traditional Karnataka mixed vegetable saagu.', 100, 340, 8, 58, 9, 4, 380, ['Vegetarian'], []],
  ['Spring Dosa', 'Crispy roll stuffed with sautéed julienned cabbage, bell peppers, carrots, and spring onions.', 120, 310, 6, 50, 10, 5, 440, ['Vegetarian'], []],
  ['Paneer Bhurji Dosa', 'High-protein dosa packed with spicy scrambled cottage cheese, onions, and fresh coriander.', 150, 420, 18, 45, 18, 4, 460, ['High-Protein', 'Vegetarian'], []],
  ['Butter Masala Dosa', 'Rich dosa cooked with a generous slab of butter, stuffed with turmeric-spiced potato filling.', 125, 410, 6, 49, 21, 3, 440, ['Vegetarian'], ['HIGH_FAT']],
  ['Kara Dosa', 'Traditional Tamil Nadu spicy dosa smeared with roasted shallots and fiery red chilli paste.', 100, 310, 6, 48, 11, 3, 480, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Ghee Podi Onion Dosa', 'Golden dosa topped with crisp shallots and spiced lentil podi, basted in aromatic ghee.', 130, 390, 7, 50, 18, 4, 420, ['Vegetarian'], []],
  ['Neer Dosa', 'Delicate, lace-thin, melt-in-mouth rice crepes from Mangalore, served with coconut chutney.', 95, 230, 4, 45, 4, 2, 280, ['Vegetarian', 'Gluten-Free'], []],

  // Idlis & Vadas
  ['Plain Steamed Idli', 'Soft, fluffy steamed fermented rice and black gram cakes served with hot sambar and chutney.', 55, 180, 6, 36, 1, 2, 260, ['Vegetarian', 'Gluten-Free', 'Low-Fat'], ['DIABETIC_SAFE']],
  ['Kanchipuram Idli', 'Traditional spiced idlis tempered with black pepper, cumin, ginger, and curry leaves in ghee.', 85, 240, 7, 38, 7, 2, 310, ['Vegetarian', 'Gluten-Free'], []],
  ['Thatte Idli', 'Plate-sized fluffy Karnataka idli steamed on flat plates, served with red chutney and saagu.', 70, 220, 7, 44, 2, 2, 290, ['Vegetarian', 'Gluten-Free'], []],
  ['Ghee Sambar Mini Idli', 'Bowl of fourteen bite-sized button idlis soaked completely in steaming hot aromatic sambar.', 90, 260, 8, 46, 6, 4, 460, ['Vegetarian'], []],
  ['Crispy Medu Vada', 'Golden brown, donut-shaped crispy lentil fritters with a fluffy interior, served with coconut dip.', 65, 280, 8, 28, 15, 1, 390, ['Vegetarian'], ['HIGH_FAT']],
  ['Sambar Vada', 'Deep-fried crispy medu vadas submerged in piping hot, tangy lentil vegetable sambar.', 75, 310, 9, 36, 15, 3, 490, ['Vegetarian'], []],
  ['Curd Vada (Dahi Vada)', 'Lentil vadas soaked in chilled whipped yogurt, garnished with roasted cumin, boondi, and coriander.', 80, 270, 9, 32, 12, 6, 360, ['Vegetarian'], ['GUT_FRIENDLY']],
  ['Rava Idli', 'Semolina cakes infused with roasted cashews, mustard seeds, green chillies, and steamed to perfection.', 75, 230, 6, 39, 6, 2, 330, ['Vegetarian'], []],
  ['Poha Idli', 'Super light steamed idlis made with beaten rice flakes and curd, exceptionally easy to digest.', 70, 190, 5, 37, 2, 2, 250, ['Vegetarian', 'Gluten-Free'], ['GUT_FRIENDLY']],
  ['Button Ghee Podi Idli', 'Mini idlis tossed in roasted gunpowder spice mix and clarified butter, aromatic and crunchy.', 95, 290, 7, 40, 12, 3, 410, ['Vegetarian'], []],

  // Breakfast & Comfort
  ['Ven Pongal', 'Classic South Indian comfort dish of rice and yellow moong dal cooked with crushed peppercorns and ghee.', 80, 310, 8, 46, 11, 2, 340, ['Vegetarian', 'Gluten-Free'], ['GUT_FRIENDLY']],
  ['Rava Upma', 'Roasted semolina cooked with mustard seeds, curry leaves, ginger, green chillies, and crunchy cashews.', 65, 250, 5, 42, 7, 2, 360, ['Vegetarian'], []],
  ['Semiya Upma', 'Toasted vermicelli stir-cooked with garden vegetables, turmeric, and aromatic south Indian tempering.', 70, 240, 5, 43, 6, 2, 350, ['Vegetarian'], []],
  ['Poha with Roasted Peanuts', 'Fluffy flattened rice flakes tempered with mustard, turmeric, sweet onions, and crunchy peanuts.', 70, 260, 6, 44, 7, 3, 330, ['Vegetarian', 'Gluten-Free'], []],
  ['Poori Masala (3 Pcs)', 'Puffed, deep-fried golden whole wheat breads served with traditional spiced potato onion bhaji.', 95, 430, 8, 54, 21, 4, 460, ['Vegetarian'], ['HIGH_FAT']],
  ['Chana Poori', 'Fluffy hot pooris served with robust Amritsari black chickpea gravy and pickled green chillies.', 110, 480, 14, 62, 20, 5, 520, ['Vegetarian'], []],
  ['Sabudana Khichdi', 'Tapioca pearls tempered with cumin seeds, roasted crushed peanuts, green chillies, and diced potatoes.', 90, 350, 4, 66, 9, 3, 290, ['Vegetarian', 'Gluten-Free'], []],
  ['Appam with Veg Stew (2 Pcs)', 'Bowl-shaped fermented rice pancakes with soft spongy centers served with mild coconut vegetable stew.', 110, 280, 5, 48, 8, 4, 310, ['Vegetarian', 'Gluten-Free'], ['GUT_FRIENDLY']],
  ['Idiyappam with Kurma', 'Steamed rice string hoppers served with aromatic, mildly spiced vegetable coconut kurma.', 100, 270, 5, 49, 7, 3, 330, ['Vegetarian', 'Gluten-Free'], []],
  ['Veg Kothu Parotta', 'Flaky shredded Malabar parottas tossed on hot griddle with vegetables, spices, and salna.', 120, 440, 9, 64, 17, 5, 530, ['Vegetarian'], []],
  ['Bisi Bele Bath', 'Authentic Karnataka hot lentil rice dish prepared with spiced tamarind extract, vegetables, and ghee.', 95, 330, 8, 56, 9, 4, 420, ['Vegetarian', 'Gluten-Free'], []],
  ['Curd Rice with Pomegranate', 'Creamy, comforting yogurt rice tempered with mustard, ginger, curry leaves, and ruby pomegranate pearls.', 75, 240, 6, 38, 7, 5, 290, ['Vegetarian', 'Gluten-Free'], ['GUT_FRIENDLY']],

  // Paneer Delicacies
  ['Palak Paneer', 'Fresh cottage cheese cubes cooked in a smooth, vibrant spinach puree with mild garlic seasoning.', 195, 320, 16, 12, 24, 3, 390, ['Vegetarian', 'High-Protein', 'Low-Carb'], ['DIABETIC_SAFE']],
  ['Paneer Butter Masala', 'Tender paneer cubes simmered in a velvety, rich tomato, cashew, and fresh dairy cream gravy.', 210, 430, 15, 18, 33, 6, 480, ['Vegetarian'], ['HIGH_FAT']],
  ['Shahi Paneer', 'Royal Mughlai preparation of cottage cheese in a thick, sweet-savory white cashew and saffron sauce.', 220, 440, 14, 20, 34, 7, 440, ['Vegetarian'], ['HIGH_FAT']],
  ['Kadai Paneer', 'Paneer cubes tossed with crunchy bell peppers, onions, and freshly pounded aromatic coriander spices.', 200, 360, 16, 15, 26, 4, 460, ['Vegetarian', 'High-Protein'], []],
  ['Matar Paneer', 'Comforting North Indian curry of soft paneer cubes and tender sweet green peas in spiced onion tomato gravy.', 185, 330, 15, 22, 22, 5, 420, ['Vegetarian'], []],
  ['Paneer Tikka Masala', 'Char-grilled smoky paneer tikka chunks simmered in a spicy, rich, roasted red capsicum gravy.', 215, 390, 17, 16, 29, 5, 490, ['Vegetarian', 'High-Protein'], []],
  ['Malai Kofta', 'Golden fried cottage cheese and potato dumplings bathed in a luxurious, creamy cashew nut sauce.', 225, 480, 12, 32, 34, 8, 470, ['Vegetarian'], ['HIGH_FAT']],
  ['Paneer Pasanda', 'Shallow-fried paneer sandwiches stuffed with spiced nuts and khoya, served in a rich brown gravy.', 230, 490, 16, 24, 36, 7, 450, ['Vegetarian'], ['HIGH_FAT']],
  ['Paneer Lababdar', 'Rich and creamy curry with grated and cubed paneer, cooked with tomatoes, onions, and kasuri methi.', 210, 410, 17, 16, 31, 5, 470, ['Vegetarian', 'High-Protein'], []],
  ['Handi Paneer', 'Cottage cheese cubes slow-cooked in a clay handi with whole spices and thick, spicy onion gravy.', 200, 370, 16, 15, 27, 4, 460, ['Vegetarian'], []],
  ['Paneer Makhani', 'Cottage cheese pieces cooked gently in silky tomato makhani gravy enriched with dollops of white butter.', 210, 420, 15, 17, 32, 6, 460, ['Vegetarian'], ['HIGH_FAT']],
  ['Paneer Do Pyaza', 'Savory paneer dish loaded with two stages of onions—caramelized and crunchy petal stir-fry.', 195, 350, 15, 18, 25, 5, 440, ['Vegetarian'], []],
  ['Mughlai Paneer', 'Exotic preparation with paneer cubes in an almond paste gravy flavored with kewra water and cardamom.', 220, 430, 15, 16, 33, 5, 420, ['Vegetarian'], ['HIGH_FAT']],
  ['Achari Paneer', 'Zesty cottage cheese cooked with traditional Indian pickling spices like fennel, nigella, and mustard seeds.', 195, 340, 15, 14, 25, 3, 490, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Paneer Bhurji Gravy', 'Scrambled cottage cheese tossed with tomatoes, green chillies, ginger, and cumin in a semi-dry masala.', 190, 330, 17, 12, 24, 3, 410, ['Vegetarian', 'High-Protein', 'Low-Carb'], ['DIABETIC_SAFE']],

  // Dals & Lentils
  ['Dal Makhani', 'Whole black lentils and kidney beans slow-simmered overnight over tandoor, finished with butter and cream.', 175, 380, 14, 38, 19, 3, 460, ['Vegetarian', 'High-Protein'], ['HIGH_FAT']],
  ['Dal Tadka', 'Yellow pigeon pea dal tempered with sizzling ghee, roasted cumin, garlic, and dried red chillies.', 150, 230, 11, 32, 7, 2, 380, ['Vegetarian', 'Gluten-Free', 'High-Protein'], ['DIABETIC_SAFE']],
  ['Dal Fry', 'Spiced toor dal cooked with sautéed onions, tomatoes, ginger, and fresh green coriander.', 145, 220, 10, 31, 6, 2, 360, ['Vegetarian', 'Gluten-Free'], ['DIABETIC_SAFE']],
  ['Panchmel Dal', 'Nutritious Rajasthani preparation combining five lentils: toor, moong, chana, masoor, and urad.', 165, 260, 15, 35, 7, 2, 370, ['Vegetarian', 'High-Protein', 'Gluten-Free'], ['DIABETIC_SAFE']],
  ['Chana Dal Palak', 'Hearty yellow split Bengal gram cooked with tender chopped spinach leaves and mild garlic tadka.', 155, 240, 13, 34, 6, 2, 340, ['Vegetarian', 'High-Protein', 'Gluten-Free'], ['DIABETIC_SAFE', 'HEART_HEALTHY']],
  ['Dhaba Style Yellow Dal', 'Homestyle yellow dal tempered aggressively with whole dry red chillies, mustard seeds, and asafoetida.', 140, 210, 10, 30, 6, 2, 390, ['Vegetarian', 'Gluten-Free'], []],
  ['Dal Maharani', 'Royal blend of black lentils, split chickpeas, and kidney beans in an aromatic spiced tomato base.', 170, 320, 14, 36, 13, 3, 420, ['Vegetarian', 'High-Protein'], []],
  ['Sambar Home-style', 'Traditional South Indian lentil stew loaded with drumsticks, shallots, carrots, and homemade sambar podi.', 90, 160, 6, 26, 4, 4, 440, ['Vegetarian', 'Gluten-Free'], []],
  ['Tomato Rasam', 'Fiery, tangy South Indian clear broth made with fresh ripe tomatoes, crushed garlic, and black pepper.', 70, 95, 2, 14, 3, 3, 380, ['Vegetarian', 'Gluten-Free', 'Low-Calorie'], ['GUT_FRIENDLY']],
  ['Pepper Jeera Rasam', 'Medicinal clear broth with freshly crushed black peppercorns, roasted cumin, and tamarind water.', 70, 90, 2, 12, 3, 2, 350, ['Vegetarian', 'Gluten-Free', 'Low-Calorie'], ['GUT_FRIENDLY']],

  // North Indian Sabzis & Curries
  ['Chole Masala', 'Tender chickpeas simmered in a dark, robust gravy infused with tea leaves, anardana, and Punjabi spices.', 160, 310, 13, 44, 9, 4, 480, ['Vegetarian', 'High-Protein'], ['DIABETIC_SAFE']],
  ['Rajma Masala', 'Red kidney beans slow-cooked in a thick tomato-onion gravy, finished with kasuri methi and garam masala.', 160, 290, 13, 42, 8, 3, 450, ['Vegetarian', 'High-Protein'], ['DIABETIC_SAFE']],
  ['Aloo Gobi Masala', 'Classic dry stir-fry of tender potato cubes and cauliflower florets with turmeric, ginger, and green chillies.', 145, 210, 5, 28, 9, 3, 380, ['Vegetarian', 'Gluten-Free'], []],
  ['Dum Aloo Kashmiri', 'Baby potatoes slow-cooked in a tangy, aromatic yogurt and fennel-flavored crimson Kashmiri chili gravy.', 165, 280, 5, 34, 14, 4, 410, ['Vegetarian'], []],
  ['Bhindi Masala', 'Crisp okra stir-fried with sliced onions, dry mango powder (amchur), and ground spices.', 145, 190, 4, 20, 11, 3, 360, ['Vegetarian', 'Gluten-Free'], ['DIABETIC_SAFE']],
  ['Baingan Bharta', 'Smoky char-roasted eggplant mashed and sautéed with green peas, onions, garlic, and fresh green herbs.', 150, 180, 4, 19, 10, 4, 350, ['Vegetarian', 'Gluten-Free'], ['DIABETIC_SAFE']],
  ['Mix Veg Kadai', 'Crunchy French beans, carrots, peas, and bell peppers wok-tossed in a spicy crushed coriander masala.', 155, 220, 6, 26, 11, 4, 390, ['Vegetarian', 'Gluten-Free'], []],
  ['Navratan Korma', 'Mild and aromatic Mughlai curry containing nine assorted vegetables, fruits, and dry nuts in sweet cashew gravy.', 180, 360, 8, 34, 21, 9, 390, ['Vegetarian'], []],
  ['Mushroom Matar Masala', 'Fresh button mushrooms and tender sweet green peas simmered in a luscious onion-tomato masala.', 175, 210, 8, 22, 10, 4, 410, ['Vegetarian', 'Gluten-Free'], ['DIABETIC_SAFE']],
  ['Aloo Methi', 'Homestyle sauté of diced potatoes with fresh, slightly bitter fenugreek leaves and mild cumin seeds.', 140, 200, 4, 27, 9, 2, 340, ['Vegetarian', 'Gluten-Free'], []],
  ['Veg Jalfrezi', 'Spicy, tangy stir-fry of mixed vegetables and paneer in a sweet-and-sour tomato glaze with slit chillies.', 160, 240, 7, 28, 12, 6, 420, ['Vegetarian'], []],
  ['Methi Malai Matar', 'Creamy, comforting curry made with fresh fenugreek leaves and sweet green peas in rich milk cream.', 185, 370, 9, 26, 26, 6, 390, ['Vegetarian'], ['HIGH_FAT']],
  ['Corn Palak', 'Sweet yellow corn kernels simmered gently in a vibrant, velvety garlic-infused spinach puree.', 165, 230, 7, 29, 10, 4, 360, ['Vegetarian', 'Gluten-Free'], ['HEART_HEALTHY']],
  ['Sarson Ka Saag', 'Traditional Punjabi winter delicacy of pureed mustard greens, spinach, and bathua, cooked with white butter.', 180, 260, 8, 20, 17, 3, 410, ['Vegetarian', 'Gluten-Free'], []],
  ['Aloo Shimla Mirch', 'Stir-fried potato wedges and green bell peppers tossed with roasted cumin, turmeric, and dry mango powder.', 135, 190, 3, 27, 8, 3, 340, ['Vegetarian', 'Gluten-Free'], []],

  // Breads & Parathas
  ['Butter Naan', 'Tandoor-baked leavened flatbread made from refined flour, generously brushed with salted butter.', 50, 240, 6, 38, 7, 2, 320, ['Vegetarian'], []],
  ['Garlic Naan', 'Aromatic flatbread baked in clay oven topped with minced garlic, fresh coriander, and melted butter.', 65, 260, 7, 39, 8, 2, 340, ['Vegetarian'], []],
  ['Tandoori Roti', 'Whole wheat flatbread baked directly against the hot walls of a clay tandoor oven, crisp and smoky.', 30, 140, 4, 28, 1, 1, 190, ['Vegetarian', 'Low-Fat'], ['DIABETIC_SAFE']],
  ['Laccha Paratha', 'Multi-layered flaky whole wheat bread cooked on griddle with ghee until golden brown and crispy.', 55, 280, 6, 36, 13, 2, 310, ['Vegetarian'], []],
  ['Aloo Stuffed Paratha', 'Hearty whole wheat flatbread stuffed with spiced mashed potatoes, roasted on tawa with butter.', 85, 330, 7, 48, 12, 2, 390, ['Vegetarian'], []],
  ['Gobi Paratha', 'Pan-fried whole wheat bread stuffed with finely grated spiced cauliflower, ginger, and green chillies.', 85, 290, 7, 43, 10, 2, 380, ['Vegetarian'], []],
  ['Paneer Paratha', 'Nutritious flatbread stuffed with grated cottage cheese, green chillies, and cumin seeds.', 105, 380, 14, 42, 17, 2, 410, ['Vegetarian', 'High-Protein'], []],
  ['Missi Roti', 'Nutritious Rajasthani bread made from chickpea flour (besan) and wheat flour, spiced with ajwain.', 45, 170, 7, 26, 4, 1, 280, ['Vegetarian', 'High-Protein'], ['DIABETIC_SAFE']],
  ['Bhatura (2 Pcs)', 'Puffed, golden-fried fermented soft bread that pairs traditionally with Punjabi chole masala.', 75, 410, 8, 52, 19, 3, 440, ['Vegetarian'], ['HIGH_FAT']],
  ['Onion Kulcha', 'Soft leavened tandoori bread stuffed with seasoned chopped onions, coriander, and carom seeds.', 70, 270, 6, 42, 8, 3, 350, ['Vegetarian'], []],

  // Rice & Pulaos
  ['Veg Hyderabadi Dum Biryani', 'Aromatic long-grain basmati rice layered with spiced marinated vegetables, saffron, and fried onions.', 170, 410, 9, 68, 12, 4, 520, ['Vegetarian', 'Gluten-Free'], []],
  ['Kashmiri Pulao', 'Fragrant basmati rice cooked with whole spices, milk, saffron, and garnished with fried fruits and nuts.', 180, 390, 7, 65, 12, 9, 380, ['Vegetarian', 'Gluten-Free'], []],
  ['Jeera Rice', 'Fluffy basmati rice tempered with aromatic royal cumin seeds (shahi jeera) and clarified desi ghee.', 120, 270, 5, 48, 7, 1, 290, ['Vegetarian', 'Gluten-Free'], []],
  ['Peas Pulao', 'Delicate basmati rice tossed with sweet green peas, whole cloves, cardamom, and bay leaves.', 130, 280, 6, 50, 7, 2, 310, ['Vegetarian', 'Gluten-Free'], []],
  ['Paneer Biryani', 'Layered basmati rice specialty loaded with marinated cottage cheese cubes, mint leaves, and saffron.', 195, 460, 17, 64, 16, 4, 540, ['Vegetarian', 'High-Protein'], []],
  ['Veg Fried Rice', 'Wok-tossed long grain rice with finely diced carrots, beans, bell peppers, soy sauce, and white pepper.', 140, 320, 6, 56, 8, 3, 510, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Schezwan Fried Rice', 'Spicy Indo-Chinese fried rice stir-fried with crisp garden vegetables and fiery red Schezwan chili paste.', 155, 340, 7, 58, 9, 4, 580, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Ghee Rice', 'Aromatic coastal rice dish cooked in pure desi ghee with whole spices, fried cashews, and raisins.', 140, 340, 5, 52, 13, 3, 320, ['Vegetarian', 'Gluten-Free'], []],

  // Snacks & Street Food
  ['Pav Bhaji', 'Spiced buttery vegetable mash served hot with two soft, griddle-toasted buttered pav bread buns.', 130, 420, 8, 54, 19, 6, 580, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Extra Cheese Pav Bhaji', 'Classic vegetable mash smothered under a generous blanket of grated processed cheese and butter.', 160, 510, 14, 56, 27, 6, 680, ['Vegetarian'], ['HIGH_FAT', 'HIGH_SODIUM']],
  ['Samosa with Mint Chutney (2 Pcs)', 'Crispy golden pastry triangles stuffed with spiced potato and green peas, served with sweet & sour dips.', 50, 310, 5, 36, 16, 3, 420, ['Vegetarian'], ['HIGH_FAT']],
  ['Pani Puri (8 Pcs)', 'Crispy hollow semolina puris filled with spiced boiled potato and chickpeas, dunked in mint-tamarind water.', 60, 180, 4, 34, 4, 4, 460, ['Vegetarian'], []],
  ['Sev Puri', 'Crisp flat papdis topped with diced potatoes, onions, trio of chutneys, and smothered with crunchy nylon sev.', 70, 260, 5, 38, 10, 6, 480, ['Vegetarian'], []],
  ['Dahi Puri (6 Pcs)', 'Puffed crispy shells filled with potatoes and sweetened chilled yogurt, drizzled with sweet tamarind sauce.', 80, 290, 7, 42, 11, 10, 390, ['Vegetarian'], ['GUT_FRIENDLY']],
  ['Aloo Tikki Chaat', 'Crisp shallow-fried potato patties topped with warm spiced chickpeas, sweet curd, and tangy chutneys.', 85, 340, 7, 46, 14, 7, 510, ['Vegetarian'], []],
  ['Gobi Manchurian Dry', 'Batter-coated crispy cauliflower florets tossed with garlic, ginger, spring onions, and dark soy sauce.', 150, 310, 6, 44, 12, 5, 560, ['Vegetarian'], ['HIGH_SODIUM']],
  ['Veg Spring Rolls', 'Crispy fried wafer rolls stuffed with finely shredded cabbage, carrots, capsicum, and bean sprouts.', 130, 280, 5, 36, 13, 3, 440, ['Vegetarian'], ['HIGH_FAT']],
  ['Crispy Corn Pepper Salt', 'Sweet corn kernels flash-fried until crunchy, tossed with cracked black pepper, sea salt, and scallions.', 140, 260, 5, 38, 10, 3, 420, ['Vegetarian', 'Gluten-Free'], []],
];

console.log(`Prepared ${vegItems.length} Veg items`);

export { vegItems };
