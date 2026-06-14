import { prisma } from "../src/config/prisma.js";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rating = () => Number((4 + Math.random() * 0.9).toFixed(1)); // 4.0 - 4.9

/* -------------------------------------------------------------------------- */
/*  Product Images — 200 products across 10 categories                        */
/* -------------------------------------------------------------------------- */

const PRODUCT_IMAGES: Record<string, string> = {
  /* ======================== Fruits & Vegetables ======================== */
  "Banana (Robusta)":
    "https://www.bbassets.com/media/uploads/p/l/10000025_32-fresho-banana-robusta.jpg",
  "Apple Shimla":
    "http://maatarafruitscompany.com/wp-content/uploads/2022/01/WhatsApp-Image-2022-01-11-at-16.53.57-1.jpeg",
  Tomato:
    "https://5.imimg.com/data5/SELLER/Default/2025/3/494778467/FV/ZL/PL/66789684/tomatoes-fresh-indian-500x500.jpg",
  Onion:
    "https://frugivore-bucket.s3.amazonaws.com/media/package/img_one/2019-08-28/437_oSNVLVq.jpg",
  Potato: "https://tiimg.tistatic.com/fp/1/003/990/fresh-indian-potato-903.jpg",
  "Spinach (Palak)": "https://m.media-amazon.com/images/I/71tdN2taTCL.jpg",
  "Coriander Bunch":
    "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/77bbdc77-e345-4dd0-85be-3e65ff082279.png",
  Lemon: "https://5.imimg.com/data5/FQ/JQ/MY-12687905/fresh-indian-lemon.jpg",
  Cucumber:
    "https://tiimg.tistatic.com/fp/1/006/871/healthy-and-natural-fresh-cucumber-691.jpg",
  "Green Chilli":
    "https://cdn.store.link/products/fatafat/dw165n-5.png?versionId=b5m4vzWKQeqE.2keDvmrK.Xbxi4M04lH",
  Pomegranate:
    "https://m.media-amazon.com/images/I/71c3tbqC1sL._AC_UF894,1000_QL80_.jpg",
  "Green Grapes":
    "https://m.media-amazon.com/images/I/512E-dz5BBL._AC_UF894,1000_QL80_.jpg",
  Orange:
    "https://m.media-amazon.com/images/I/41SN44--WKL._AC_UF894,1000_QL80_.jpg",
  "Alphonso Mango":
    "https://m.media-amazon.com/images/I/61+bqeuktuL._AC_UF894,1000_QL80_.jpg",
  Watermelon:
    "https://m.media-amazon.com/images/I/71ZaS7W9dYL._AC_UF894,1000_QL80_.jpg",
  Carrot:
    "https://cdn.kibsons.com/products/display/HPL_CARNOINXX500AO_20251010101903.jpg",
  Capsicum:
    "https://www.bbassets.com/media/uploads/p/l/10000068_26-fresho-capsicum-green.jpg",
  Cauliflower:
    "https://upscsabjiwala.com/wp-content/uploads/2023/11/40205742_1-fresho-cauliflower-small.webp",
  Ginger:
    "https://www.bbassets.com/media/uploads/p/xl/30007402_7-fresho-thai-ginger.jpg",
  Garlic:
    "https://www.bbassets.com/media/uploads/p/l/10000114_19-fresho-garlic.jpg",

  /* ===================== Dairy, Bread & Eggs ===================== */
  "Amul Gold Milk":
    "https://m.media-amazon.com/images/I/513busazFhL._AC_UF894,1000_QL80_.jpg",
  "Mother Dairy Toned Milk":
    "https://milkkart.in/wp-content/uploads/2025/01/Mother-Dairy-Toned-Milk-02.webp",
  "Amul Butter":
    "https://m.media-amazon.com/images/I/61FzvpdoS6L._AC_UF894,1000_QL80_.jpg",
  "Amul Cheese Slices":
    "https://nagabazaar.com/cdn/shop/files/Amul-Cheese-Slice-200-gm-10-slices.jpg?v=1747519841",
  "Britannia Brown Bread":
    "http://www.starquik.com/cdn/shop/files/SQ102413_FOP_0c91f524-7b9f-4a55-ae1b-808a6480f54f.jpg?v=1776845429",
  "Harvest Gold White Bread":
    "https://tiimg.tistatic.com/fp/1/007/617/no-added-preservative-and-healthy-harvest-gold-fresh-white-bread-955.jpg",
  "Farm Eggs":
    "https://www.bbassets.com/media/uploads/p/l/40210965_1-proto-farm-fresh-brown-eggs.jpg",
  "Amul Masti Dahi":
    "https://m.media-amazon.com/images/I/71JroQLV8iL._AC_UF894,1000_QL80_.jpg",
  "Amul Fresh Paneer":
    "https://m.media-amazon.com/images/I/91jB46ntQ4L._AC_UF894,1000_QL80_.jpg",
  "Nestle Fresh Cream": "https://m.media-amazon.com/images/I/61uAkK0YPWL.jpg",
  "Amul Buttermilk":
    "https://5.imimg.com/data5/SELLER/Default/2023/2/ZM/CY/QL/143359525/amul-buttermilk-500-ml-500x500.jpg",
  "Amul Ghee":
    "https://nagabazaar.com/cdn/shop/files/amul-pure-ghee-200-ml-quick-pantry-1.jpg?v=1747520975&width=500",
  "Milkmaid Condensed Milk":
    "https://m.media-amazon.com/images/I/71CE0VUaGmL._AC_UF894,1000_QL80_.jpg",
  "Everyday Dairy Whitener":
    "https://5.imimg.com/data5/SELLER/Default/2023/5/307512127/YG/MP/CT/66565206/200g-nestle-everyday-dairy-whitener.jpg",
  "Britannia Cheese Spread":
    "https://www.luckystore.in/cdn/shop/files/Britannia-The-Laughing-Cow-Processed-Cheese-Spreadz-Classic-180g-_Pack-of-4_-_-Creamy_-Smooth_-and-Delicious-Luckystore-60023840.png?v=1752234439&width=1445",
  "Mother Dairy Curd":
    "https://www.bbassets.com/media/uploads/p/l/70000738_1-mother-dairy-curd.jpg",
  "Epigamia Greek Yogurt":
    "https://slyce-product.s3.ap-south-1.amazonaws.com/MILK%20%26%20DAIRY%20PRODUCTS_null_EPIGAMIA%20NATURAL%20GREEK%20YOGURT%2090G_image_2022-05-11T07%3A30%3A43.616.jpg",
  "Modern Multigrain Bread":
    "https://m.media-amazon.com/images/I/71xCwxIDhTL._AC_UF894,1000_QL80_.jpg",
  "Pav Buns":
    "https://5.imimg.com/data5/ECOM/Default/2025/5/509713262/KP/MG/HJ/114136878/sliding-image-366180ajpgts1687616751-942fd986-8ef0-4047-95ca-84fa1744ff39.jpg",
  "Brown Eggs":
    "https://www.eggoz.com/cdn/shop/files/Browneggsbg.jpg?v=1771403606&width=1445",

  /* ======================== Snacks & Munchies ======================== */
  "Lay's Classic Salted": "https://m.media-amazon.com/images/I/71axGdrNHoL.jpg",
  "Kurkure Masala Munch":
    "https://132255452.cdn6.editmysite.com/uploads/1/3/2/2/132255452/NNQVFEY2PV36BIQMX7WIEE4F.jpeg?width=2400&optimize=medium",
  "Haldiram's Aloo Bhujia":
    "https://shop.coles.com.au/wcsstore/Coles-CAS/images/5/2/5/5258448-zm.jpg",
  "Bingo Mad Angles":
    "https://s7ap1.scene7.com/is/image/itcportalprod/Chips_800x800_4x?fmt=webp-alpha",
  "Doritos Nacho Cheese":
    "https://m.media-amazon.com/images/I/81IyMnDbyaL._AC_UF894,1000_QL80_.jpg",
  "Uncle Chipps Spicy":
    "https://m.media-amazon.com/images/I/51zCAeE-ueL._AC_UF894,1000_QL80_.jpg",
  "Too Yumm Multigrain Chips":
    "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/91f7301a-89d1-438c-ab9c-a3e03c8aeae1.png?bg_token=color.background.quaternary",
  "Lay's Magic Masala":
    "https://www.tastyrewards.com/sites/default/files/2026-02/271-PRODUCT-SHOT-984x983-MAGIC-MASALA.png",
  "Pringles Original": "https://m.media-amazon.com/images/I/71-7xPT-n0L.jpg",
  "Haldiram's Soan Papdi":
    "https://m.media-amazon.com/images/I/81oKfY99zsL.jpg",
  "Bingo Tedhe Medhe":
    "https://5.imimg.com/data5/SELLER/Default/2025/1/479284076/YI/ZU/NB/239135034/whatsapp-image-2025-01-08-at-9-38-12-am-1.jpeg",
  "Cheetos Masala Balls":
    "https://rukminim2.flixcart.com/image/480/640/xif0q/chips/r/7/f/252-masala-balls-1-cheetos-original-imah96svgr598ufk.jpeg?q=90",
  "Act II Popcorn": "https://m.media-amazon.com/images/I/61MFylrXndL.jpg",
  "Hide & Seek Cookies":
    "http://www.starquik.com/cdn/shop/files/SQ101942_FOP_99614ca4-76aa-4623-8fd7-52468bab43c4.jpg?v=1776848154",
  "Dark Fantasy Choco Fills":
    "https://m.media-amazon.com/images/I/61u5mDGXMZL.jpg",
  "Parle-G Biscuits":
    "https://m.media-amazon.com/images/I/81MNovOvXML._AC_UF894,1000_QL80_.jpg",
  "Good Day Cashew Cookies":
    "https://m.media-amazon.com/images/I/61DCGTtY6GL.jpg",
  "Roasted Peanuts":
    "https://m.media-amazon.com/images/I/610bwz-hSqL._AC_UF350,350_QL80_.jpg",
  "Haldiram's Bhujia Sev":
    "https://m.media-amazon.com/images/I/710SVdke6jL._AC_UF894,1000_QL80_.jpg",
  "Monaco Biscuits":
    "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_1200,h_630/NI_CATALOG/IMAGES/CIW/2025/10/14/e6c98201-9fa4-416b-b1c2-f8a0d7d8856a_193_1.png",

  /* ===================== Cold Drinks & Juices ===================== */
  "Coca-Cola":
    "https://www.bbassets.com/media/uploads/p/xl/251023_11-coca-cola-soft-drink-original-taste.jpg",
  Pepsi: "https://m.media-amazon.com/images/I/61rmYnJvWzL.jpg",
  Sprite: "https://m.media-amazon.com/images/I/71doy6em4jL.jpg",
  "Thums Up":
    "https://www.bbassets.com/media/uploads/p/xl/251014_12-thums-up-soft-drink.jpg",
  "Real Mixed Fruit Juice":
    "https://m.media-amazon.com/images/I/71ccvWtmXXL._AC_UF894,1000_QL80_.jpg",
  "Tropicana Orange":
    "https://www.tropicana.com/images/products/tropicana-pure-premium-no-pulp-320.png",
  "Maaza Mango":
    "http://www.starquik.com/cdn/shop/files/SQ152823_FOP_b3554c26-60bc-45a2-a309-94ac9a6e02ec.jpg?v=1776846278",
  "Red Bull Energy Drink":
    "https://m.media-amazon.com/images/I/51Bp30CR3IL._AC_UF894,1000_QL80_.jpg",
  "Bisleri Water":
    "https://www.bbassets.com/media/uploads/p/l/265875_7-bisleri-mineral-water.jpg",
  "Paper Boat Aamras": "https://m.media-amazon.com/images/I/61mKIt8BtYL.jpg",
  "Fanta Orange":
    "https://www.bbassets.com/media/uploads/p/l/251019_8-fanta-soft-drink-orange-flavoured.jpg",
  "Mountain Dew": "https://m.media-amazon.com/images/I/51xCIV-ZJqL.jpg",
  "7UP":
    "https://www.bbassets.com/media/uploads/p/l/40130830_10-7-up-soft-drink-lemon.jpg",
  Limca: "https://m.media-amazon.com/images/I/51IRLdwmqcL.jpg",
  "Frooti Mango":
    "https://www.bbassets.com/media/uploads/p/l/40129410_7-frooti-mango-drink-fresh-n-juicy.jpg",
  "Sting Energy Drink":
    "https://5.imimg.com/data5/SELLER/Default/2021/5/GA/QN/UA/107425127/250ml-sting-energy-drink.jpg",
  "Amul Kool Badam": "https://m.media-amazon.com/images/I/71R9So+SkCL.jpg",
  "Nimbooz Lemon": "https://m.media-amazon.com/images/I/71O40udRAuL.jpg",
  "Cocofly Tender Coconut Water":
    "https://5.imimg.com/data5/FG/LP/MH/SELLER-87375850/tender-coconut-water.jpg",
  "Lipton Iced Tea":
    "https://www.bbassets.com/media/uploads/p/l/40170409_1-lipton-ice-tea-lemon-flavoured.jpg",

  /* ===================== Pharmacy & Wellness ===================== */
  "Dolo 650 Tablets":
    "https://cdn01.pharmeasy.in/dam/products/059346/dolo-650mg-strip-of-15-tablets-combo-3-1753347024.jpg",
  "Crocin Advance":
    "https://www.crocin.com/content/dam/cf-consumer-healthcare/panadol-reborn/en_IN/product-detail/380x463/Crocin-Advance-Pack_20May22-380x463.png",
  "Vicks VapoRub": "https://m.media-amazon.com/images/I/71bBjtfhfVL.jpg",
  "Dettol Antiseptic Liquid":
    "https://m.media-amazon.com/images/I/51fFgtFBshL._AC_UF1000,1000_QL80_.jpg",
  "Electral ORS Powder":
    "https://m.media-amazon.com/images/I/51L+eel9tWL._AC_UF350,350_QL50_.jpg",
  "Band-Aid Strips":
    "https://images.ctfassets.net/58z2odx42k4g/FbV0yHDA516hZHzRqoJZr/779e81643d423d4a4bb9b031bb73e0eb/bab_381370044086_us_tough_strip_aos_bcp_20ct_00000_1-en-us",
  "Digene Antacid Gel":
    "https://m.media-amazon.com/images/I/617HYFuU62L._AC_UF350,350_QL80_.jpg",
  "Volini Pain Relief Spray":
    "https://m.media-amazon.com/images/I/51EpB2LQ7pL.jpg",
  "Cetirizine Tablets":
    "https://tiimg.tistatic.com/fp/2/007/776/cetirizine-hydrochloride-tablets-ip-packaging-size-10-x-5-x10-tablets--807.jpg",
  "Hand Sanitizer":
    "https://5.imimg.com/data5/SELLER/Default/2025/7/529658107/WY/OQ/CS/73903203/hand-sanitizer.jpeg",
  "Combiflam Tablets":
    "https://m.media-amazon.com/images/I/614c-6Ya4FL._AC_UF1000,1000_QL80_.jpg",
  "Disprin Tablets":
    "https://m.media-amazon.com/images/I/61s0uTIz1sL._AC_UF894,1000_QL80_.jpg",
  "Strepsils Lozenges":
    "https://m.media-amazon.com/images/I/61hNbmxDlLL._AC_UF1000,1000_QL80_.jpg",
  "Benadryl Cough Syrup":
    "https://images.ctfassets.net/aub2fvcyp2t8/4gVUt0H0AqpRhg9LXV3Vge/1a0fefd2978783927eb4516539233d7b/bottle_2-en-in",
  "Betadine Antiseptic Cream":
    "https://images.apollo247.in/pub/media/catalog/product/B/E/BET0204_1-JULY23_1.jpg",
  "Cotton Roll":
    "https://images.apollo247.in/pub/media/catalog/product/d/c/dcp0134_1.jpg",
  "Digital Thermometer":
    "https://m.media-amazon.com/images/I/61vBn0ngEbL._AC_UF1000,1000_QL80_.jpg",
  "Zandu Balm":
    "https://images.apollo247.in/pub/media/catalog/product/Z/A/ZAN0012_1-AUG23_1.jpg",
  "Glucon-D Glucose":
    "https://cdn.shopify.com/s/files/1/0650/3615/7095/files/7_4d0fc56d-c642-473e-9021-cecba3d468ab.jpg?v=1734355125",
  "Limcee Vitamin C": "https://m.media-amazon.com/images/I/71FcUpi5X4L.jpg",

  /* ===================== Cleaning & Household ===================== */
  "Surf Excel Detergent": "https://m.media-amazon.com/images/I/61m1Pn9lzHL.jpg",
  "Vim Dishwash Gel":
    "https://m.media-amazon.com/images/I/51rhw--KcDL._AC_UF1000,1000_QL80_.jpg",
  "Harpic Toilet Cleaner":
    "https://m.media-amazon.com/images/I/61T6b7FYI4L._AC_UF1000,1000_QL80_.jpg",
  "Lizol Floor Cleaner": "https://m.media-amazon.com/images/I/71RoDtaEGgL.jpg",
  "Colin Glass Cleaner":
    "https://rukminim2.flixcart.com/image/480/640/xif0q/glass-cleaner/e/y/q/-original-imahf84pj7hgzgcb.jpeg?q=90",
  "Scotch-Brite Scrub Pad":
    "https://www.panchamrutha.com/cdn/shop/files/Screenshot_1241.png?v=1765428553&width=746",
  "Good Knight Refill":
    "https://www.starquik.com/cdn/shop/files/SQ105879_FOP_44984358-0a03-41b6-a336-fcd2c3bd30b9.jpg?v=1776844336&width=533",
  "Odonil Air Freshener":
    "https://m.media-amazon.com/images/I/71u7WMjOYgL._AC_UF1000,1000_QL80_.jpg",
  "Garbage Bags":
    "https://5.imimg.com/data5/SELLER/Default/2024/6/426882080/JJ/RU/IY/201942697/presto-garbage-bags.jpg",
  "Comfort Fabric Conditioner":
    "https://m.media-amazon.com/images/I/51+E7fCElML._AC_UF1000,1000_QL80_.jpg",
  "Rin Detergent Bar":
    "https://5.imimg.com/data5/SELLER/Default/2023/1/SZ/LL/DH/8032410/rin-detergent-bar-4x250g-500x500.jpeg",
  "Exo Dishwash Bar":
    "https://rukmini1.flixcart.com/image/1500/1500/xif0q/dish-washing-bar/z/b/z/dish-wash-bar-500g-3-pack-of-3-anti-bacterial-soap-3-1500-exo-original-imahf2ug9hz2s2gb.jpeg?q=70",
  "Domex Disinfectant":
    "https://5.imimg.com/data5/SELLER/Default/2021/6/XK/JL/VL/74531469/domex-disinfectant-toilet-bowl-cleaner-500-ml-500x500.jpg",
  "Toilet Paper Rolls":
    "https://m.media-amazon.com/images/I/71lzRkD+txL._AC_UF1000,1000_QL80_.jpg",
  "Facial Tissue Box":
    "https://5.imimg.com/data5/SELLER/Default/2025/10/555348447/DH/KU/HA/57586836/origami-facial-tissue-box-2-ply-100-pulls-assorted-colour.jpeg",
  "Wet Wipes":
    "https://m.media-amazon.com/images/I/71i9FL8p5-L._AC_UF1000,1000_QL80_.jpg",
  "Phenyl Concentrate":
    "https://m.media-amazon.com/images/I/51ub8a5nsQL._AC_UF1000,1000_QL80_.jpg",
  "Cleaning Mop":
    "https://m.media-amazon.com/images/I/71GeEDlmPqL._AC_UF1000,1000_QL80_.jpg",
  Broom:
    "https://rukminim2.flixcart.com/image/480/640/xif0q/broom-brush/c/a/k/-original-imahay3ykf8an2bs.jpeg?q=90",
  Dustbin:
    "https://5.imimg.com/data5/SQ/FB/BE/SELLER-64853152/cello-padal-bin-with-bucket.jpg",

  /* ======================== Personal Care ======================== */
  "Colgate Toothpaste":
    "https://m.media-amazon.com/images/I/51+joDIObdL._AC_UF1000,1000_QL80_.jpg",
  "Dove Beauty Bar":
    "http://tipriht.com/cdn/shop/files/IMG_9188.webp?v=1759241771",
  "Head & Shoulders Shampoo":
    "https://images.ctfassets.net/j6utfne5ne6b/4sFaAGU04NOR7SNDmljokJ/407ce033d3f3fe6eb7288fa2cb119128/08_H_S_SS-340ML-FRONT_80844160.jpg?fm=webp&q=70",
  "Gillette Razor":
    "https://m.media-amazon.com/images/I/71zMLM5wemL._AC_UF1000,1000_QL80_.jpg",
  "Nivea Body Lotion":
    "https://lyko.com/globalassets/product-images/nivea-body-lotion-irresistibly-smooth-250-ml-1479-663-0250_1.jpg?ref=C9CA9C96C3&w=296&h=904&quality=75",
  "Dettol Handwash":
    "https://m.media-amazon.com/images/I/51WU9rX6HfL._AC_UF1000,1000_QL80_.jpg",
  "Vaseline Lip Care":
    "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/vsl/vsl20677/l/13.jpg",
  "Pampers Diapers":
    "https://m.media-amazon.com/images/I/71+AlTqZNFL._AC_UF1000,1000_QL80_.jpg",
  "Whisper Sanitary Pads":
    "https://m.media-amazon.com/images/I/61TvI7mwWML._AC_UF1000,1000_QL80_.jpg",
  "Park Avenue Deodorant":
    "https://m.media-amazon.com/images/I/81wTivl5KsL._AC_UF1000,1000_QL80_.jpg",
  "Himalaya Face Wash":
    "https://m.media-amazon.com/images/I/518vOMhYAZL._AC_UF1000,1000_QL80_.jpg",
  "Parachute Coconut Hair Oil":
    "https://m.media-amazon.com/images/I/61dUCXFgN3L._AC_UF1000,1000_QL80_.jpg",
  "Lakmé Sunscreen SPF 50":
    "https://www.lakmesalon.in/cdn/shop/products/SIZE-W-600-X-H-600-PX-01_6fb7bc07-adad-4f40-9b70-c4c31c122a80.jpg?v=1623326504&width=416",
  "Pond's Talcum Powder":
    "https://m.media-amazon.com/images/I/514IUH1crjL._AC_UF1000,1000_QL80_.jpg",
  "Gillette Shaving Foam":
    "https://images.ctfassets.net/7tfi3razjgvb/2d75gH5KAXWuS1rO2rcMoV/fb112548da6d0a1942453d8816899418/DT_Overview_20Img_4ct_402x.png",
  "Listerine Mouthwash":
    "https://images.apollo247.in/pub/media/catalog/product/l/i/lis0012_1.jpg",
  "Cotton Buds":
    "https://m.media-amazon.com/images/I/61tMzJB1+UL._AC_UF1000,1000_QL80_.jpg",
  "Oral-B Toothbrush":
    "https://www.planethealth.in/image/cache/catalog/oral-b-all-rounder-123-cavity-toothbrush-v-2-pc-1-500x500.png",
  "Nail Cutter":
    "https://images-eu.ssl-images-amazon.com/images/I/61byLgyrzeL._AC_UL495_SR435,495_.jpg",
  "Patanjali Aloe Vera Gel":
    "https://m.media-amazon.com/images/I/61HP-finy8L.jpg",

  /* =================== Breakfast & Instant Food =================== */
  "Maggi 2-Minute Noodles":
    "https://www.maggi.com.au/sites/default/files/styles/product_image_tab_landscape_384_768/public/2025-03/147118-Maggi-Noodles-90_-PCR-Plastic-Renders_Chicken_5pk_FOP_FA.png?itok=TMD18sYz",
  "Kellogg's Corn Flakes":
    "https://rukminim2.flixcart.com/image/480/640/xif0q/cereal-flake/0/i/u/-original-imahmywf9gjxnf7f.jpeg?q=90",
  "Quaker Oats": "https://m.media-amazon.com/images/I/71XUeN07hYL.jpg",
  "MTR Poha":
    "https://5.imimg.com/data5/CQ/UM/MY-10457880/mtr-instant-breakfast-mix-poha-500x500.jpg",
  "Top Ramen Noodles":
    "https://www.bbassets.com/media/uploads/p/xl/263515_3-top-ramen-noodles-curry-veg.jpg",
  "Knorr Soup":
    "https://m.media-amazon.com/images/I/61HU1mFqD1L._AC_UF894,1000_QL80_.jpg",
  "Saffola Masala Oats":
    "https://m.media-amazon.com/images/I/71d0wtpbxJL._AC_UF894,1000_QL80_.jpg",
  "Nutella Hazelnut Spread":
    "https://cheapandcheerfulcooking.com/wp-content/uploads/2021/03/vegan-nutella-hazelnut-spread-with-cocoa-1.jpg",
  "Kissan Mixed Fruit Jam":
    "https://m.media-amazon.com/images/I/51NJJNAATTL.jpg",
  "Aashirvaad Atta":
    "https://www.miniindiagrocery.nl/cdn/shop/files/aashirvaad-atta-wheat-flour.webp?v=1777377041&width=1445",
  "India Gate Basmati Rice":
    "https://m.media-amazon.com/images/I/81mHz4XKK0L.jpg",
  "Tata Toor Dal":
    "https://www.bbassets.com/media/uploads/p/xl/40000291_14-tata-sampann-unpolished-toor-dalarhar-dal.jpg",
  "Fortune Sunflower Oil":
    "https://m.media-amazon.com/images/I/711JQozA+sL.jpg",
  "Tata Salt": "https://m.media-amazon.com/images/I/61tKlw6caqL.jpg",
  "Madhur Sugar":
    "https://www.bbassets.com/media/uploads/p/l/244096_6-madhur-sugar-refined.jpg",
  "Tata Tea Gold":
    "https://m.media-amazon.com/images/I/61L6hooC+ZL._AC_UF894,1000_QL80_.jpg",
  "Bru Instant Coffee": "https://m.media-amazon.com/images/I/71PDygGCk6L.jpg",
  "Maggi Tomato Ketchup":
    "https://m.media-amazon.com/images/I/41bWRMsOBLL._AC_UF894,1000_QL80_.jpg",
  "Sunfeast Pasta Treat":
    "https://www.bbassets.com/media/uploads/p/xl/279366_13-sunfeast-yippee-pasta-treat-tomato-cheese.jpg",
  "iD Idli Dosa Batter":
    "https://m.media-amazon.com/images/I/61cBzCsqRlL._AC_UF894,1000_QL80_.jpg",

  /* =================== Party & Celebrations =================== */
  "Birthday Candles":
    "http://oasisupply.com/cdn/shop/products/1007.jpg?v=1578512022",
  "Paper Plates": "https://m.media-amazon.com/images/I/71020e5hgZL.jpg",
  "Party Balloons":
    "https://5.imimg.com/data5/SELLER/Default/2023/4/298643963/WP/YB/PI/161416329/whatsapp-image-2023-04-07-at-11-00-06.jpeg",
  "Cadbury Celebrations Box":
    "https://m.media-amazon.com/images/I/812Nv19tf3L.jpg",
  "Pringles Party Pack": "https://m.media-amazon.com/images/I/71-7xPT-n0L.jpg",
  "Coca-Cola Party Pack":
    "https://www.bbassets.com/media/uploads/p/xl/251023_11-coca-cola-soft-drink-original-taste.jpg",
  "Disposable Cups":
    "https://rukminim2.flixcart.com/image/480/480/xif0q/cup-saucer/a/8/h/paper-glass-disposable-tea-cup-pack-of-100-pcs-150-ml-white-original-imagsy5hy5zeyehd.jpeg?q=90",
  "Party Poppers":
    "https://thepartystation.com/cdn/shop/files/2-best-party-decor-stationers-confetti-party-popper-30cm-golden-original-imagg7fqbghxcnzd.webp?v=1736091802&width=1214",
  "Lay's Party Pack": "https://m.media-amazon.com/images/I/71axGdrNHoL.jpg",
  "Ferrero Rocher Box":
    "https://www.ferrerorocher.com/in/sites/ferrerorocher20_in/files/2022-09/t16.png?t=1776758583",
  "Happy Birthday Banner":
    "https://img.magnific.com/premium-psd/happy-birthday-greeting-celebration-post-card-web-banner-design_1016189-2255.jpg?semt=ais_hybrid&w=740&q=80",
  "LED String Lights":
    "https://m.media-amazon.com/images/I/51Gwg80A+HL._AC_UF1000,1000_QL80_.jpg",
  "Gift Wrapping Paper":
    "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/2025/JULY/18/nTzIA0vR_4b3ee419a491454dac18acdd4d7bf5ea.jpg",
  "Greeting Card":
    "https://archiesonline.com/cdn/shop/files/img_1920x_65b24f5ebc50f0-86639959-20728858.jpg?v=1753949789",
  "Party Hats":
    "https://m.media-amazon.com/images/I/715l1+24OuL._AC_UF1000,1000_QL80_.jpg",
  "Chocolate Truffle Cake":
    "https://cdn.uengage.io/uploads/7175/image-LNVBQ8-1706080822.jpg",
  "Amul Vanilla Ice Cream Tub":
    "https://m.media-amazon.com/images/I/717SDqu2stL.jpg",
  "Cadbury Dairy Milk Silk":
    "https://m.media-amazon.com/images/I/61T051di2QL._AC_UF894,1000_QL80_.jpg",
  "Sparklers (Phuljhadi)":
    "https://5.imimg.com/data5/SELLER/Default/2021/3/KF/GB/JS/115283629/030.jpg",
  "Cocktail Snack Platter Mix":
    "https://m.media-amazon.com/images/I/71axGdrNHoL.jpg",

  /* =================== Stationery & Essentials =================== */
  "Classmate Notebook":
    "https://tiimg.tistatic.com/fp/1/007/804/classmate-soft-cover-6-subject-spiral-binding-notebook-single-line-300-pages-397.jpg",
  "Reynolds Ball Pens":
    "https://i.ebayimg.com/images/g/uiEAAOSwsDpkPStJ/s-l1200.jpg",
  "Apsara Pencils": "https://m.media-amazon.com/images/I/71DogBHEINL.jpg",
  "Fevicol Glue": "https://m.media-amazon.com/images/I/51TezS1l1pL.jpg",
  "Kangaro Stapler":
    "https://m.media-amazon.com/images/I/51zBROx3rcL._AC_UF1000,1000_QL80_.jpg",
  "A4 Paper Ream":
    "https://rukminim2.flixcart.com/image/480/640/kjkbv680-0/paper/k/6/l/paper-a4-paper-jk-paper-original-imafz3uqppqyjybx.jpeg?q=90",
  "Sticky Notes": "https://m.media-amazon.com/images/I/61zuWaYqeAL.jpg",
  "Highlighter Set":
    "https://cdn.shopify.com/s/files/1/0659/6388/4787/products/FC19675-YL-ZZZ_Faber-Castell-Textliner-48-Highlighter-Yellow_P1.jpg",
  Scissors:
    "https://m.media-amazon.com/images/I/61d6KvR327L._AC_UF1000,1000_QL80_.jpg",
  "Cello Tape":
    "http://www.stationeryplug.com/cdn/shop/products/CelloTape2inch.jpg?v=1660027502",
  "Whiteboard Marker":
    "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2026/5/4/5148efbf-925b-495f-b3cd-72b0a088c5ad_97287.jpg",
  "Geometry Box":
    "https://www.kokuyocamlin.com/camlin/camel-access/image/catalog/assets/camlin/geometry-box/geometry-boxes/scholar-geometry-box/camlin-scholar-geometry-box/1.JPG",
  "Eraser & Sharpener Set":
    "https://m.media-amazon.com/images/I/51bmLOeOjcL._AC_UF1000,1000_QL80_.jpg",
  "Sketch Pens":
    "https://truewholesale.in/storage/product-images/17370209521.jpg",
  "File Folder":
    "https://static1.industrybuying.com/products/office-supplies/files-folders/box-files/OF.OF.FI.LE.284448_1736511002664.webp",
  "Casio Calculator":
    "https://www.casio.com/content/dam/casio/product-info/locales/in/en/calc/product/practical/M/MJ/MJ1/mj-100da/assets/MJ-100DA.jpg.transform/main-visual-sp/image.jpg",
  "Sticky Flags": "https://m.media-amazon.com/images/I/81lOW0WPcrL.jpg",
  "Drawing Sheets":
    "https://images.jdmagicbox.com/quickquotes/images_main/classmate_drawing_book_2001138__11926592_0.jpg",
  "Glue Stick":
    "https://m.media-amazon.com/images/I/71HhDhTZ4qL._AC_UF1000,1000_QL80_.jpg",
  "Plastic Ruler 30cm":
    "https://5.imimg.com/data5/WA_9696/Default/2026/2/582228577/NX/XJ/YL/3464834/image.jpeg",
};

// Real image if we have one, otherwise an empty string (frontend shows its fallback).
const img = (name: string) => PRODUCT_IMAGES[name] ?? "";

type ProductSpec = { name: string; brand: string; mrp: number; unit: string };
type Cat = {
  name: string;
  slug: string;
  icon: string;
  tags: string[];
  vibes: string[];
  products: ProductSpec[];
};
type Status =
  | "PLACED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

/* -------------------------------------------------------------------------- */
/*  Static data: 10 categories x 20 distinct products = 200 products          */
/* -------------------------------------------------------------------------- */

const CATEGORIES: Cat[] = [
  {
    name: "Fruits & Vegetables",
    slug: "fruits-vegetables",
    icon: "🥦",
    tags: ["fresh", "daily"],
    vibes: ["casual"],
    products: [
      { name: "Banana (Robusta)", brand: "Fresho", mrp: 50, unit: "500 g" },
      { name: "Apple Shimla", brand: "Fresho", mrp: 90, unit: "500 g" },
      { name: "Tomato", brand: "Fresho", mrp: 30, unit: "500 g" },
      { name: "Onion", brand: "Fresho", mrp: 35, unit: "500 g" },
      { name: "Potato", brand: "Fresho", mrp: 28, unit: "500 g" },
      { name: "Spinach (Palak)", brand: "Fresho", mrp: 25, unit: "250 g" },
      { name: "Coriander Bunch", brand: "Fresho", mrp: 15, unit: "100 g" },
      { name: "Lemon", brand: "Fresho", mrp: 20, unit: "250 g" },
      { name: "Cucumber", brand: "Fresho", mrp: 22, unit: "500 g" },
      { name: "Green Chilli", brand: "Fresho", mrp: 18, unit: "100 g" },
      { name: "Pomegranate", brand: "Fresho", mrp: 80, unit: "500 g" },
      { name: "Green Grapes", brand: "Fresho", mrp: 60, unit: "500 g" },
      { name: "Orange", brand: "Fresho", mrp: 70, unit: "1 kg" },
      { name: "Alphonso Mango", brand: "Fresho", mrp: 200, unit: "1 kg" },
      { name: "Watermelon", brand: "Fresho", mrp: 60, unit: "1 pc" },
      { name: "Carrot", brand: "Fresho", mrp: 30, unit: "500 g" },
      { name: "Capsicum", brand: "Fresho", mrp: 25, unit: "250 g" },
      { name: "Cauliflower", brand: "Fresho", mrp: 35, unit: "1 pc" },
      { name: "Ginger", brand: "Fresho", mrp: 20, unit: "100 g" },
      { name: "Garlic", brand: "Fresho", mrp: 30, unit: "100 g" },
    ],
  },
  {
    name: "Dairy, Bread & Eggs",
    slug: "dairy-bread-eggs",
    icon: "🥛",
    tags: ["daily", "breakfast"],
    vibes: ["casual"],
    products: [
      { name: "Amul Gold Milk", brand: "Amul", mrp: 36, unit: "500 ml" },
      {
        name: "Mother Dairy Toned Milk",
        brand: "Mother Dairy",
        mrp: 27,
        unit: "500 ml",
      },
      { name: "Amul Butter", brand: "Amul", mrp: 56, unit: "100 g" },
      {
        name: "Amul Cheese Slices",
        brand: "Amul",
        mrp: 130,
        unit: "pack of 5",
      },
      {
        name: "Britannia Brown Bread",
        brand: "Britannia",
        mrp: 45,
        unit: "400 g",
      },
      {
        name: "Harvest Gold White Bread",
        brand: "Harvest Gold",
        mrp: 40,
        unit: "400 g",
      },
      { name: "Farm Eggs", brand: "Eggoz", mrp: 72, unit: "pack of 6" },
      { name: "Amul Masti Dahi", brand: "Amul", mrp: 30, unit: "200 g" },
      { name: "Amul Fresh Paneer", brand: "Amul", mrp: 95, unit: "200 g" },
      { name: "Nestle Fresh Cream", brand: "Nestle", mrp: 75, unit: "250 ml" },
      { name: "Amul Buttermilk", brand: "Amul", mrp: 20, unit: "500 ml" },
      { name: "Amul Ghee", brand: "Amul", mrp: 320, unit: "500 ml" },
      {
        name: "Milkmaid Condensed Milk",
        brand: "Nestle",
        mrp: 140,
        unit: "400 g",
      },
      {
        name: "Everyday Dairy Whitener",
        brand: "Nestle",
        mrp: 120,
        unit: "200 g",
      },
      {
        name: "Britannia Cheese Spread",
        brand: "Britannia",
        mrp: 110,
        unit: "180 g",
      },
      {
        name: "Mother Dairy Curd",
        brand: "Mother Dairy",
        mrp: 45,
        unit: "400 g",
      },
      {
        name: "Epigamia Greek Yogurt",
        brand: "Epigamia",
        mrp: 45,
        unit: "90 g",
      },
      {
        name: "Modern Multigrain Bread",
        brand: "Modern",
        mrp: 50,
        unit: "400 g",
      },
      { name: "Pav Buns", brand: "Britannia", mrp: 35, unit: "pack of 6" },
      { name: "Brown Eggs", brand: "Eggoz", mrp: 120, unit: "pack of 12" },
    ],
  },
  {
    name: "Snacks & Munchies",
    slug: "snacks-munchies",
    icon: "🍿",
    tags: ["snacks", "evening"],
    vibes: ["party", "casual"],
    products: [
      { name: "Lay's Classic Salted", brand: "Lay's", mrp: 20, unit: "52 g" },
      { name: "Kurkure Masala Munch", brand: "Kurkure", mrp: 20, unit: "75 g" },
      {
        name: "Haldiram's Aloo Bhujia",
        brand: "Haldiram's",
        mrp: 50,
        unit: "200 g",
      },
      { name: "Bingo Mad Angles", brand: "Bingo", mrp: 20, unit: "66 g" },
      { name: "Doritos Nacho Cheese", brand: "Doritos", mrp: 30, unit: "70 g" },
      {
        name: "Uncle Chipps Spicy",
        brand: "Uncle Chipps",
        mrp: 20,
        unit: "55 g",
      },
      {
        name: "Too Yumm Multigrain Chips",
        brand: "Too Yumm",
        mrp: 30,
        unit: "55 g",
      },
      { name: "Lay's Magic Masala", brand: "Lay's", mrp: 20, unit: "52 g" },
      { name: "Pringles Original", brand: "Pringles", mrp: 110, unit: "107 g" },
      {
        name: "Haldiram's Soan Papdi",
        brand: "Haldiram's",
        mrp: 95,
        unit: "250 g",
      },
      { name: "Bingo Tedhe Medhe", brand: "Bingo", mrp: 20, unit: "70 g" },
      { name: "Cheetos Masala Balls", brand: "Cheetos", mrp: 20, unit: "55 g" },
      { name: "Act II Popcorn", brand: "Act II", mrp: 35, unit: "70 g" },
      {
        name: "Hide & Seek Cookies",
        brand: "Britannia",
        mrp: 40,
        unit: "100 g",
      },
      {
        name: "Dark Fantasy Choco Fills",
        brand: "Sunfeast",
        mrp: 40,
        unit: "75 g",
      },
      { name: "Parle-G Biscuits", brand: "Parle", mrp: 10, unit: "80 g" },
      {
        name: "Good Day Cashew Cookies",
        brand: "Britannia",
        mrp: 35,
        unit: "100 g",
      },
      {
        name: "Roasted Peanuts",
        brand: "Tasty Nibbles",
        mrp: 60,
        unit: "200 g",
      },
      {
        name: "Haldiram's Bhujia Sev",
        brand: "Haldiram's",
        mrp: 55,
        unit: "200 g",
      },
      { name: "Monaco Biscuits", brand: "Parle", mrp: 30, unit: "120 g" },
    ],
  },
  {
    name: "Cold Drinks & Juices",
    slug: "cold-drinks-juices",
    icon: "🥤",
    tags: ["beverages", "chilled"],
    vibes: ["party", "casual"],
    products: [
      { name: "Coca-Cola", brand: "Coca-Cola", mrp: 40, unit: "750 ml" },
      { name: "Pepsi", brand: "Pepsi", mrp: 40, unit: "750 ml" },
      { name: "Sprite", brand: "Sprite", mrp: 40, unit: "750 ml" },
      { name: "Thums Up", brand: "Thums Up", mrp: 40, unit: "750 ml" },
      { name: "Real Mixed Fruit Juice", brand: "Real", mrp: 110, unit: "1 L" },
      { name: "Tropicana Orange", brand: "Tropicana", mrp: 120, unit: "1 L" },
      { name: "Maaza Mango", brand: "Maaza", mrp: 45, unit: "600 ml" },
      {
        name: "Red Bull Energy Drink",
        brand: "Red Bull",
        mrp: 125,
        unit: "250 ml",
      },
      { name: "Bisleri Water", brand: "Bisleri", mrp: 20, unit: "1 L" },
      {
        name: "Paper Boat Aamras",
        brand: "Paper Boat",
        mrp: 35,
        unit: "250 ml",
      },
      { name: "Fanta Orange", brand: "Fanta", mrp: 40, unit: "750 ml" },
      { name: "Mountain Dew", brand: "Mountain Dew", mrp: 40, unit: "750 ml" },
      { name: "7UP", brand: "7UP", mrp: 40, unit: "750 ml" },
      { name: "Limca", brand: "Limca", mrp: 40, unit: "750 ml" },
      { name: "Frooti Mango", brand: "Frooti", mrp: 35, unit: "600 ml" },
      { name: "Sting Energy Drink", brand: "Sting", mrp: 20, unit: "250 ml" },
      { name: "Amul Kool Badam", brand: "Amul", mrp: 30, unit: "200 ml" },
      { name: "Nimbooz Lemon", brand: "Nimbooz", mrp: 25, unit: "350 ml" },
      {
        name: "Cocofly Tender Coconut Water",
        brand: "Cocofly",
        mrp: 45,
        unit: "200 ml",
      },
      { name: "Lipton Iced Tea", brand: "Lipton", mrp: 30, unit: "250 ml" },
    ],
  },
  {
    name: "Pharmacy & Wellness",
    slug: "pharmacy-wellness",
    icon: "💊",
    tags: ["pharmacy", "health"],
    vibes: ["medical", "emergency"],
    products: [
      {
        name: "Dolo 650 Tablets",
        brand: "Micro Labs",
        mrp: 32,
        unit: "strip of 15",
      },
      { name: "Crocin Advance", brand: "Crocin", mrp: 30, unit: "strip of 15" },
      { name: "Vicks VapoRub", brand: "Vicks", mrp: 95, unit: "25 ml" },
      {
        name: "Dettol Antiseptic Liquid",
        brand: "Dettol",
        mrp: 99,
        unit: "250 ml",
      },
      {
        name: "Electral ORS Powder",
        brand: "Electral",
        mrp: 22,
        unit: "21.5 g",
      },
      {
        name: "Band-Aid Strips",
        brand: "Band-Aid",
        mrp: 45,
        unit: "pack of 10",
      },
      { name: "Digene Antacid Gel", brand: "Digene", mrp: 120, unit: "200 ml" },
      {
        name: "Volini Pain Relief Spray",
        brand: "Volini",
        mrp: 185,
        unit: "55 g",
      },
      {
        name: "Cetirizine Tablets",
        brand: "Cipla",
        mrp: 18,
        unit: "strip of 10",
      },
      { name: "Hand Sanitizer", brand: "Lifebuoy", mrp: 55, unit: "100 ml" },
      {
        name: "Combiflam Tablets",
        brand: "Sanofi",
        mrp: 45,
        unit: "strip of 20",
      },
      {
        name: "Disprin Tablets",
        brand: "Disprin",
        mrp: 12,
        unit: "strip of 10",
      },
      {
        name: "Strepsils Lozenges",
        brand: "Strepsils",
        mrp: 45,
        unit: "pack of 8",
      },
      {
        name: "Benadryl Cough Syrup",
        brand: "Benadryl",
        mrp: 120,
        unit: "100 ml",
      },
      {
        name: "Betadine Antiseptic Cream",
        brand: "Betadine",
        mrp: 95,
        unit: "20 g",
      },
      { name: "Cotton Roll", brand: "Gom", mrp: 45, unit: "100 g" },
      {
        name: "Digital Thermometer",
        brand: "Dr Trust",
        mrp: 250,
        unit: "1 unit",
      },
      { name: "Zandu Balm", brand: "Zandu", mrp: 60, unit: "25 ml" },
      { name: "Glucon-D Glucose", brand: "Glucon-D", mrp: 70, unit: "200 g" },
      {
        name: "Limcee Vitamin C",
        brand: "Limcee",
        mrp: 40,
        unit: "strip of 15",
      },
    ],
  },
  {
    name: "Cleaning & Household",
    slug: "cleaning-household",
    icon: "🧽",
    tags: ["household", "cleaning"],
    vibes: ["casual"],
    products: [
      {
        name: "Surf Excel Detergent",
        brand: "Surf Excel",
        mrp: 130,
        unit: "1 kg",
      },
      { name: "Vim Dishwash Gel", brand: "Vim", mrp: 99, unit: "500 ml" },
      {
        name: "Harpic Toilet Cleaner",
        brand: "Harpic",
        mrp: 95,
        unit: "500 ml",
      },
      { name: "Lizol Floor Cleaner", brand: "Lizol", mrp: 99, unit: "500 ml" },
      { name: "Colin Glass Cleaner", brand: "Colin", mrp: 90, unit: "500 ml" },
      {
        name: "Scotch-Brite Scrub Pad",
        brand: "Scotch-Brite",
        mrp: 35,
        unit: "pack of 2",
      },
      {
        name: "Good Knight Refill",
        brand: "Good Knight",
        mrp: 80,
        unit: "45 ml",
      },
      { name: "Odonil Air Freshener", brand: "Odonil", mrp: 75, unit: "50 g" },
      { name: "Garbage Bags", brand: "Presto!", mrp: 99, unit: "30 bags" },
      {
        name: "Comfort Fabric Conditioner",
        brand: "Comfort",
        mrp: 120,
        unit: "400 ml",
      },
      { name: "Rin Detergent Bar", brand: "Rin", mrp: 40, unit: "pack of 4" },
      { name: "Exo Dishwash Bar", brand: "Exo", mrp: 30, unit: "pack of 3" },
      { name: "Domex Disinfectant", brand: "Domex", mrp: 95, unit: "500 ml" },
      {
        name: "Toilet Paper Rolls",
        brand: "Origami",
        mrp: 99,
        unit: "pack of 4",
      },
      {
        name: "Facial Tissue Box",
        brand: "Origami",
        mrp: 60,
        unit: "100 pulls",
      },
      { name: "Wet Wipes", brand: "Himalaya", mrp: 60, unit: "pack of 30" },
      {
        name: "Phenyl Concentrate",
        brand: "Patanjali",
        mrp: 60,
        unit: "500 ml",
      },
      { name: "Cleaning Mop", brand: "Gala", mrp: 199, unit: "1 unit" },
      { name: "Broom", brand: "Gala", mrp: 120, unit: "1 unit" },
      { name: "Dustbin", brand: "Cello", mrp: 199, unit: "10 L" },
    ],
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    icon: "🧴",
    tags: ["personal-care"],
    vibes: ["casual"],
    products: [
      { name: "Colgate Toothpaste", brand: "Colgate", mrp: 99, unit: "100 g" },
      { name: "Dove Beauty Bar", brand: "Dove", mrp: 65, unit: "100 g" },
      {
        name: "Head & Shoulders Shampoo",
        brand: "Head & Shoulders",
        mrp: 180,
        unit: "180 ml",
      },
      { name: "Gillette Razor", brand: "Gillette", mrp: 150, unit: "1 unit" },
      { name: "Nivea Body Lotion", brand: "Nivea", mrp: 199, unit: "200 ml" },
      { name: "Dettol Handwash", brand: "Dettol", mrp: 99, unit: "200 ml" },
      { name: "Vaseline Lip Care", brand: "Vaseline", mrp: 75, unit: "10 g" },
      {
        name: "Pampers Diapers",
        brand: "Pampers",
        mrp: 399,
        unit: "pack of 22",
      },
      {
        name: "Whisper Sanitary Pads",
        brand: "Whisper",
        mrp: 175,
        unit: "pack of 15",
      },
      {
        name: "Park Avenue Deodorant",
        brand: "Park Avenue",
        mrp: 199,
        unit: "150 ml",
      },
      {
        name: "Himalaya Face Wash",
        brand: "Himalaya",
        mrp: 130,
        unit: "100 ml",
      },
      {
        name: "Parachute Coconut Hair Oil",
        brand: "Parachute",
        mrp: 80,
        unit: "200 ml",
      },
      {
        name: "Lakmé Sunscreen SPF 50",
        brand: "Lakmé",
        mrp: 250,
        unit: "50 g",
      },
      { name: "Pond's Talcum Powder", brand: "Pond's", mrp: 75, unit: "100 g" },
      {
        name: "Gillette Shaving Foam",
        brand: "Gillette",
        mrp: 250,
        unit: "200 g",
      },
      {
        name: "Listerine Mouthwash",
        brand: "Listerine",
        mrp: 150,
        unit: "250 ml",
      },
      { name: "Cotton Buds", brand: "Johnson's", mrp: 60, unit: "pack of 100" },
      {
        name: "Oral-B Toothbrush",
        brand: "Oral-B",
        mrp: 60,
        unit: "pack of 2",
      },
      { name: "Nail Cutter", brand: "Lacto", mrp: 50, unit: "1 unit" },
      {
        name: "Patanjali Aloe Vera Gel",
        brand: "Patanjali",
        mrp: 90,
        unit: "150 ml",
      },
    ],
  },
  {
    name: "Breakfast & Instant Food",
    slug: "breakfast-instant",
    icon: "🍜",
    tags: ["instant", "breakfast"],
    vibes: ["casual", "emergency"],
    products: [
      {
        name: "Maggi 2-Minute Noodles",
        brand: "Nestle",
        mrp: 14,
        unit: "single",
      },
      {
        name: "Kellogg's Corn Flakes",
        brand: "Kellogg's",
        mrp: 175,
        unit: "475 g",
      },
      { name: "Quaker Oats", brand: "Quaker", mrp: 120, unit: "400 g" },
      { name: "MTR Poha", brand: "MTR", mrp: 60, unit: "200 g" },
      {
        name: "Top Ramen Noodles",
        brand: "Top Ramen",
        mrp: 14,
        unit: "single",
      },
      { name: "Knorr Soup", brand: "Knorr", mrp: 55, unit: "single" },
      { name: "Saffola Masala Oats", brand: "Saffola", mrp: 45, unit: "40 g" },
      {
        name: "Nutella Hazelnut Spread",
        brand: "Nutella",
        mrp: 175,
        unit: "180 g",
      },
      {
        name: "Kissan Mixed Fruit Jam",
        brand: "Kissan",
        mrp: 95,
        unit: "200 g",
      },
      { name: "Aashirvaad Atta", brand: "Aashirvaad", mrp: 60, unit: "1 kg" },
      {
        name: "India Gate Basmati Rice",
        brand: "India Gate",
        mrp: 120,
        unit: "1 kg",
      },
      { name: "Tata Toor Dal", brand: "Tata Sampann", mrp: 160, unit: "1 kg" },
      {
        name: "Fortune Sunflower Oil",
        brand: "Fortune",
        mrp: 140,
        unit: "1 L",
      },
      { name: "Tata Salt", brand: "Tata", mrp: 28, unit: "1 kg" },
      { name: "Madhur Sugar", brand: "Madhur", mrp: 50, unit: "1 kg" },
      { name: "Tata Tea Gold", brand: "Tata", mrp: 140, unit: "250 g" },
      { name: "Bru Instant Coffee", brand: "Bru", mrp: 160, unit: "50 g" },
      { name: "Maggi Tomato Ketchup", brand: "Nestle", mrp: 99, unit: "500 g" },
      {
        name: "Sunfeast Pasta Treat",
        brand: "Sunfeast",
        mrp: 35,
        unit: "65 g",
      },
      { name: "iD Idli Dosa Batter", brand: "iD", mrp: 70, unit: "1 kg" },
    ],
  },
  {
    name: "Party & Celebrations",
    slug: "party-celebrations",
    icon: "🎉",
    tags: ["party", "celebration"],
    vibes: ["party"],
    products: [
      {
        name: "Birthday Candles",
        brand: "Celebr8",
        mrp: 49,
        unit: "pack of 10",
      },
      { name: "Paper Plates", brand: "Hotpack", mrp: 60, unit: "pack of 25" },
      { name: "Party Balloons", brand: "Celebr8", mrp: 99, unit: "pack of 50" },
      {
        name: "Cadbury Celebrations Box",
        brand: "Cadbury",
        mrp: 175,
        unit: "small box",
      },
      {
        name: "Pringles Party Pack",
        brand: "Pringles",
        mrp: 299,
        unit: "pack of 3",
      },
      {
        name: "Coca-Cola Party Pack",
        brand: "Coca-Cola",
        mrp: 180,
        unit: "pack of 6",
      },
      {
        name: "Disposable Cups",
        brand: "Hotpack",
        mrp: 45,
        unit: "pack of 50",
      },
      { name: "Party Poppers", brand: "Celebr8", mrp: 99, unit: "pack of 6" },
      { name: "Lay's Party Pack", brand: "Lay's", mrp: 99, unit: "pack of 6" },
      {
        name: "Ferrero Rocher Box",
        brand: "Ferrero Rocher",
        mrp: 350,
        unit: "16 pcs",
      },
      {
        name: "Happy Birthday Banner",
        brand: "Celebr8",
        mrp: 99,
        unit: "1 unit",
      },
      { name: "LED String Lights", brand: "Celebr8", mrp: 199, unit: "5 m" },
      {
        name: "Gift Wrapping Paper",
        brand: "Celebr8",
        mrp: 99,
        unit: "pack of 5",
      },
      { name: "Greeting Card", brand: "Archies", mrp: 60, unit: "1 unit" },
      { name: "Party Hats", brand: "Celebr8", mrp: 99, unit: "pack of 10" },
      {
        name: "Chocolate Truffle Cake",
        brand: "Theobroma",
        mrp: 450,
        unit: "500 g",
      },
      {
        name: "Amul Vanilla Ice Cream Tub",
        brand: "Amul",
        mrp: 199,
        unit: "1 L",
      },
      {
        name: "Cadbury Dairy Milk Silk",
        brand: "Cadbury",
        mrp: 175,
        unit: "150 g",
      },
      {
        name: "Sparklers (Phuljhadi)",
        brand: "Celebr8",
        mrp: 60,
        unit: "pack of 10",
      },
      {
        name: "Cocktail Snack Platter Mix",
        brand: "Haldiram's",
        mrp: 150,
        unit: "400 g",
      },
    ],
  },
  {
    name: "Stationery & Essentials",
    slug: "stationery-essentials",
    icon: "✏️",
    tags: ["stationery"],
    vibes: ["casual"],
    products: [
      {
        name: "Classmate Notebook",
        brand: "Classmate",
        mrp: 60,
        unit: "single",
      },
      {
        name: "Reynolds Ball Pens",
        brand: "Reynolds",
        mrp: 50,
        unit: "pack of 5",
      },
      { name: "Apsara Pencils", brand: "Apsara", mrp: 40, unit: "pack of 10" },
      { name: "Fevicol Glue", brand: "Fevicol", mrp: 35, unit: "50 g" },
      { name: "Kangaro Stapler", brand: "Kangaro", mrp: 120, unit: "single" },
      {
        name: "A4 Paper Ream",
        brand: "JK Copier",
        mrp: 320,
        unit: "500 sheets",
      },
      { name: "Sticky Notes", brand: "Oddy", mrp: 75, unit: "pack of 3" },
      {
        name: "Highlighter Set",
        brand: "Faber-Castell",
        mrp: 99,
        unit: "set of 4",
      },
      { name: "Scissors", brand: "Cello", mrp: 60, unit: "single" },
      { name: "Cello Tape", brand: "Cello", mrp: 30, unit: "single" },
      {
        name: "Whiteboard Marker",
        brand: "Camlin",
        mrp: 80,
        unit: "pack of 4",
      },
      { name: "Geometry Box", brand: "Camlin", mrp: 150, unit: "1 unit" },
      {
        name: "Eraser & Sharpener Set",
        brand: "Apsara",
        mrp: 40,
        unit: "pack of 5",
      },
      { name: "Sketch Pens", brand: "Doms", mrp: 60, unit: "set of 12" },
      { name: "File Folder", brand: "Solo", mrp: 99, unit: "pack of 5" },
      { name: "Casio Calculator", brand: "Casio", mrp: 350, unit: "1 unit" },
      { name: "Sticky Flags", brand: "Oddy", mrp: 60, unit: "pack of 5" },
      {
        name: "Drawing Sheets",
        brand: "Classmate",
        mrp: 50,
        unit: "pack of 20",
      },
      { name: "Glue Stick", brand: "Fevistik", mrp: 50, unit: "pack of 2" },
      { name: "Plastic Ruler 30cm", brand: "Camlin", mrp: 20, unit: "1 unit" },
    ],
  },
];

const ZONES = [
  { name: "Saket", code: "SKT", city: "New Delhi", pincode: "110017" },
  { name: "Hauz Khas", code: "HKS", city: "New Delhi", pincode: "110016" },
  { name: "Connaught Place", code: "CP", city: "New Delhi", pincode: "110001" },
  {
    name: "Dwarka Sector 12",
    code: "DWK",
    city: "New Delhi",
    pincode: "110078",
  },
  {
    name: "Rohini Sector 7",
    code: "RHN",
    city: "New Delhi",
    pincode: "110085",
  },
];

const DEFAULT_ZONE_CODE = "SKT";

/* -------------------------------------------------------------------------- */
/*  Seed                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Clean slate (order matters because of foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.zoneStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.zone.deleteMany();
  console.log("🧹 Cleared existing data");

  // 2. Zones
  const zones = await prisma.zone.createManyAndReturn({ data: ZONES });
  const defaultZone = zones.find((z) => z.code === DEFAULT_ZONE_CODE)!;
  console.log(`📍 Created ${zones.length} zones`);

  // 3. Categories
  const categories = await prisma.category.createManyAndReturn({
    data: CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    })),
  });
  const categoryIdBySlug = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );
  console.log(`🗂️  Created ${categories.length} categories`);

  // 4. Products (10 categories x 20 distinct products = 200)
  const productData = CATEGORIES.flatMap((cat) =>
    cat.products.map((p) => {
      const price = Math.max(
        5,
        Math.round(p.mrp * (0.82 + Math.random() * 0.1))
      );
      return {
        name: p.name,
        description: `${p.brand} ${p.name} (${p.unit}). Delivered in minutes from your nearest store.`,
        brand: p.brand,
        price,
        mrp: p.mrp,
        unit: p.unit,
        imageUrl: img(p.name),
        rating: rating(),
        reviewCount: randInt(20, 2400),
        popularity: randInt(0, 1000),
        tags: cat.tags,
        vibes: cat.vibes,
        categoryId: categoryIdBySlug[cat.slug],
      };
    })
  );

  const products = await prisma.product.createManyAndReturn({
    data: productData,
  });
  console.log(`🛒 Created ${products.length} products`);

  // 5. Zone stock — every product is in the default zone, plus a random subset
  const otherZones = zones.filter((z) => z.code !== DEFAULT_ZONE_CODE);
  const stockData = products.flatMap((p) => {
    const shuffled = [...otherZones].sort(() => Math.random() - 0.5);
    const extra = shuffled.slice(0, randInt(2, otherZones.length));
    const inZones = [defaultZone, ...extra];
    return inZones.map((z) => ({
      productId: p.id,
      zoneId: z.id,
      // ~10% of entries are out of stock for realism
      stock: Math.random() < 0.1 ? 0 : randInt(5, 60),
      etaMinutes: randInt(8, 20),
    }));
  });
  await prisma.zoneStock.createMany({ data: stockData });
  console.log(`📦 Created ${stockData.length} zone-stock entries`);

  // 6. The demo user
  const user = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      phone: "+91 98100 12345",
      defaultZoneId: defaultZone.id,
    },
  });
  console.log(`👤 Created user: ${user.name}`);

  // 7. Order history — weekly cadence so the restock engine sees clear cycles
  const findProduct = (namePart: string) => {
    const p = products.find((x) => x.name.includes(namePart));
    if (!p) throw new Error(`Seed error: no product matches "${namePart}"`);
    return p;
  };

  const orderSpecs: {
    daysAgo: number;
    status: Status;
    items: { part: string; qty: number }[];
  }[] = [
    {
      daysAgo: 56,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Britannia Brown Bread", qty: 1 },
        { part: "Farm Eggs", qty: 1 },
        { part: "Banana", qty: 1 },
        { part: "Maggi", qty: 1 },
      ],
    },
    {
      daysAgo: 49,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Britannia Brown Bread", qty: 1 },
        { part: "Tomato", qty: 1 },
        { part: "Onion", qty: 1 },
      ],
    },
    {
      daysAgo: 42,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Farm Eggs", qty: 1 },
        { part: "Lay's Classic Salted", qty: 2 },
        { part: "Coca-Cola", qty: 1 },
      ],
    },
    {
      daysAgo: 35,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Britannia Brown Bread", qty: 1 },
        { part: "Farm Eggs", qty: 1 },
        { part: "Surf Excel Detergent", qty: 1 },
      ],
    },
    {
      daysAgo: 28,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Banana", qty: 1 },
        { part: "Colgate Toothpaste", qty: 1 },
        { part: "Dettol Handwash", qty: 1 },
      ],
    },
    {
      daysAgo: 21,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Britannia Brown Bread", qty: 1 },
        { part: "Farm Eggs", qty: 1 },
        { part: "Kurkure", qty: 2 },
        { part: "Pepsi", qty: 1 },
      ],
    },
    {
      daysAgo: 10,
      status: "DELIVERED",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Maggi", qty: 1 },
        { part: "Dolo 650", qty: 1 },
        { part: "Vicks VapoRub", qty: 1 },
      ],
    },
    {
      daysAgo: 2,
      status: "OUT_FOR_DELIVERY",
      items: [
        { part: "Amul Gold Milk", qty: 2 },
        { part: "Britannia Brown Bread", qty: 1 },
        { part: "Farm Eggs", qty: 1 },
        { part: "Coriander", qty: 1 },
      ],
    },
  ];

  for (const spec of orderSpecs) {
    const items = spec.items.map((it) => {
      const p = findProduct(it.part);
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: it.qty,
      };
    });
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        userId: user.id,
        zoneId: defaultZone.id,
        status: spec.status,
        total,
        createdAt,
        items: { create: items },
      },
    });
  }
  console.log(`🧾 Created ${orderSpecs.length} historical orders`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
