// users.js
import sql from "./db.js";
import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

const app = express();
const salt = bcrypt.genSaltSync(10);
const tokenSecret = "secret";

app.use(express.json());
app.use(cors());
app.use(express.raw({ type: "application/json" }));

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use((req, res, next) => {
  if (req.path === "/disconnect") {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  next();
});

//login
app.post(
  "/login",
  asyncHandler(async (req, res) => {
    logger("Route: /login - Incoming data: " + JSON.stringify(req.body));

    const { email, password } = req.body;
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    const worker = await sql`
        SELECT * FROM users WHERE email = ${email}
      `
      .then((rows) => rows[0])
      .catch((err) => {
        logger(`Database error while finding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    if (!worker) {
      throw { status: 401, message: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt
      .compare(password, worker.password)
      .catch((err) => {
        logger(`Password comparison error: ${err.message}`);
        throw { status: 500, message: "Error validating credentials" };
      });

    if (!isPasswordValid) {
      throw { status: 401, message: "Invalid credentials" };
    }

    const token = jwt.sign(
      { id: worker.id, type: "user", isAdmin: worker.is_admin },
      tokenSecret
    );
    logger(`Login successful for worker: ${email}`);
    res.json({ token });
  })
);

//signup
app.post(
  "/signup",
  asyncHandler(async (req, res) => {
    logger("Route: /signup - Incoming data: " + JSON.stringify(req.body));
    logger("signup");

    const { email, password, name, isAdmin } = req.body;

    console.log(email, password);

    bcrypt.hash(password, salt, async (err, hash) => {
      console.log(hash);

      let workerId = await addUserToDb({
        email,
        password: hash,
        name,
        isAdmin,
      });

      logger(
        "Route: /signup - Outgoing data: " +
          JSON.stringify({ message: "user added" })
      );
      res.json(workerId);

      if (err) throw err;
    });
  })
);


app.get(
  "/get-user",
  asyncHandler(async (req, res) => {
    const token = req.headers.auth;
    const decodedToken = jwt.verify(token, tokenSecret);

    console.log("iosAdmin +++++++++++++++++++++++++");
    console.log(decodedToken?.isAdmin);
    console.log("iosAdmin +++++++++++++++++++++++++");

    // res.json(decodedToken);
    //get the user from the database
try {
  const user = await sql`
  SELECT * FROM users WHERE id = ${decodedToken?.id}
`;
res.json(user);
} catch (error) {
  logger(`Error getting user: ${error.message}`);
  res.json({ relogin: true });
  // throw { status: 500, message: "Failed to get user", error: error.message };
}



    // if (decodedToken?.isAdmin == undefined || decodedToken?.isAdmin == null) {
    //   res.json({ isAdmin: null, relogin: true });
    // } else {
    //   res.json({ isAdmin: decodedToken?.isAdmin, relogin: false });
    // }
  })
);
app.post("/add-product-batch", asyncHandler(async (req, res) => {
  logger("Route: /add-product-batch - Incoming data batch");
  
  const products = req.body;
  if (!Array.isArray(products)) {
    throw { status: 400, message: "Request body must be an array of products" };
  }

  // Transform the data to match PostgreSQL types
  const transformedProducts = products.map(product => {
    // First, create a clean product object with all possible undefined values converted to null
    const cleanProduct = Object.fromEntries(
      Object.entries(product).map(([key, value]) => [
        key, 
        value === undefined || value === '' || value === 'NULL' || value === 'undefined' ? null : value
      ])
    );

    // Create the transformed product with explicit null checks for each field
    const transformed = {
      time_scraped: cleanProduct.time_scraped ? new Date(cleanProduct.time_scraped) : null,
      cid: cleanProduct.cid || null,
      pjson: cleanProduct.pjson || null,
      productj: cleanProduct.productj || null,
      breadcrumbj: cleanProduct.breadcrumbj || null,
      category_name: cleanProduct.category_name || null,
      category_tree: cleanProduct.category_tree || null,
      category_url: cleanProduct.category_url || null,
      product_url: cleanProduct.product_url || null,
      product_id: cleanProduct.product_id || null,
      product_id_new: cleanProduct.product_id_new || null,
      product_title: cleanProduct.product_title || null,
      brand: cleanProduct.brand || null,
      image: cleanProduct.image || null,
      last_24_hours: cleanProduct.last_24_hours ? parseInt(cleanProduct.last_24_hours) : null,
      number_in_basket: cleanProduct.number_in_basket ? parseInt(cleanProduct.number_in_basket) : null,
      product_reviews: cleanProduct.product_reviews ? parseInt(cleanProduct.product_reviews) : null,
      ratingvalue: cleanProduct.ratingvalue ? parseInt(cleanProduct.ratingvalue) : null,
      date_of_latest_review: cleanProduct.date_of_latest_review ? new Date(cleanProduct.date_of_latest_review) : null,
      date_listed: cleanProduct.date_listed ? new Date(cleanProduct.date_listed) : null,
      number_of_favourties: cleanProduct.number_of_favourties ? parseInt(cleanProduct.number_of_favourties) : null,
      related_searches: cleanProduct.related_searches === 'NULL' ? null : (cleanProduct.related_searches || null),
      star_seller: cleanProduct.star_seller === 'Y',
      ad: cleanProduct.ad === 'Y',
      digital_download: cleanProduct.digital_download === 'Y',
      price_usd: cleanProduct.price_usd ? parseFloat(cleanProduct.price_usd) : null,
      sale_price_usd: cleanProduct.sale_price_usd ? parseFloat(cleanProduct.sale_price_usd) : null,
      store_reviews: cleanProduct.store_reviews ? parseInt(cleanProduct.store_reviews) : null,
      store_name: cleanProduct.store_name || null,
      store_url: cleanProduct.store_url || null,
      store_country: cleanProduct.store_country || null,
      on_etsy_since: null,
      store_sales: cleanProduct.store_sales ? parseInt(cleanProduct.store_sales) : null,
      store_admirers: cleanProduct.store_admirers ? parseInt(cleanProduct.store_admirers) : null,
      number_of_store_products: cleanProduct.number_of_store_products ? parseInt(cleanProduct.number_of_store_products) : null,
      facebook_url: cleanProduct.facebook_url || null,
      instagram_url: cleanProduct.instagram_url || null,
      pinterest_url: cleanProduct.pinterest_url || null,
      tiktok_url: cleanProduct.tiktok_url || null,
      time_added: new Date()
    };

    return transformed;
  });
  // console.log(transformedProducts);

  for (const product of transformedProducts) {
    if (product.category_tree) {
      await processCategoryTree(product.category_tree);
    }
  }

  try {
    const result = await sql`
      INSERT INTO products ${sql(transformedProducts, 
        'time_scraped',
        'cid',
        'pjson',
        'productj',
        'breadcrumbj',
        'category_name',
        'category_tree',
        'category_url',
        'product_url',
        'product_id',
        'product_id_new',
        'product_title',
        'brand',
        'image',
        'last_24_hours',
        'number_in_basket',
        'product_reviews',
        'ratingvalue',
        'date_of_latest_review',
        'date_listed',
        'number_of_favourties',
        'related_searches',
        'star_seller',
        'ad',
        'digital_download',
        'price_usd',
        'sale_price_usd',
        'store_reviews',
        'store_name',
        'store_url',
        'store_country',
        'on_etsy_since',
        'store_sales',
        'store_admirers',
        'number_of_store_products',
        'facebook_url',
        'instagram_url',
        'pinterest_url',
        'tiktok_url',
        'time_added'
      )}
      RETURNING id
    `;
    
    logger(`Successfully inserted ${result.length} products`);
    res.json({ 
      message: "Products added successfully", 
      count: result.length,
      ids: result.map(row => row.id)
    });
  } catch (error) {
    logger(`Error inserting products: ${error.message}`);
    throw { status: 500, message: "Failed to insert products", error: error.message };
  }
}));

app.post("/add-store-batch", asyncHandler(async (req, res) => {
  logger("Route: /add-store-batch - Incoming data batch");
  
  const stores = req.body;
  if (!Array.isArray(stores)) {
    throw { status: 400, message: "Request body must be an array of stores" };
  }

  // Transform the data to match PostgreSQL types
  const transformedStores = stores.map(store => {
    // First, create a clean store object with all possible undefined values converted to null
    const cleanStore = Object.fromEntries(
      Object.entries(store).map(([key, value]) => [
        key, 
        value === undefined || value === '' || value === 'NULL' || value === 'undefined' ? null : value
      ])
    );

    // Create the transformed store with explicit null checks for each field
    const transformed = {
      store_id: cleanStore.store_id || null,
      store_name: cleanStore.store_name || null,
      store_url: cleanStore.store_url || null,
      store_sub_title: cleanStore.store_sub_title || null,
      welcome_to_our_shop_text: cleanStore.welcome_to_our_shop_text || null,
      store_logo_url: cleanStore.store_logo_url || null,
      store_description: cleanStore.store_description || null,
      most_recent_product_urls: Array.isArray(cleanStore.most_recent_product_urls) ? cleanStore.most_recent_product_urls : [],
      store_country: cleanStore.store_country || null,
      star_seller: cleanStore.star_seller === 'Y' || cleanStore.star_seller === true,
      store_last_updated: cleanStore.store_last_updated ? new Date(cleanStore.store_last_updated) : null,
      store_reviews: cleanStore.store_reviews ? parseInt(cleanStore.store_reviews) : null,
      store_review_score: cleanStore.store_review_score ? parseInt(cleanStore.store_review_score) : null,
      on_etsy_since: cleanStore.on_etsy_since ? new Date(cleanStore.on_etsy_since) : null,
      store_sales: cleanStore.store_sales ? parseInt(cleanStore.store_sales) : null,
      store_admirers: cleanStore.store_admirers ? parseInt(cleanStore.store_admirers) : null,
      number_of_store_products: cleanStore.number_of_store_products ? parseInt(cleanStore.number_of_store_products) : null,
      looking_for_more_urls: Array.isArray(cleanStore.looking_for_more_urls) ? cleanStore.looking_for_more_urls : [],
      facebook_url: cleanStore.facebook_url || null,
      instagram_url: cleanStore.instagram_url || null,
      pinterest_url: cleanStore.pinterest_url || null,
      tiktok_url: cleanStore.tiktok_url || null,
      time_added: new Date()
    };

    return transformed;
  });

  try {
    const result = await sql`
      INSERT INTO stores ${sql(transformedStores, 
        'store_id',
        'store_name',
        'store_url',
        'store_sub_title',
        'welcome_to_our_shop_text',
        'store_logo_url',
        'store_description',
        'most_recent_product_urls',
        'store_country',
        'star_seller',
        'store_last_updated',
        'store_reviews',
        'store_review_score',
        'on_etsy_since',
        'store_sales',
        'store_admirers',
        'number_of_store_products',
        'looking_for_more_urls',
        'facebook_url',
        'instagram_url',
        'pinterest_url',
        'tiktok_url',
        'time_added'
      )}
      RETURNING store_id
    `;
    
    logger(`Successfully inserted ${result.length} stores`);
    res.json({ 
      message: "Stores added successfully", 
      count: result.length,
      ids: result.map(row => row.store_id)
    });
  } catch (error) {
    logger(`Error inserting stores: ${error.message}`);
    throw { status: 500, message: "Failed to insert stores", error: error.message };
  }
}));

app.post("/add-category-batch", asyncHandler(async (req, res) => {
  logger("Route: /add-category-batch - Incoming data batch");
  
  const categories = req.body;
  if (!Array.isArray(categories)) {
    throw { status: 400, message: "Request body must be an array of categories" };
  }

  // Transform the data to match PostgreSQL types
  const transformedCategories = categories.map(category => {
    // First, create a clean category object with all possible undefined values converted to null
    const cleanCategory = Object.fromEntries(
      Object.entries(category).map(([key, value]) => [
        key, 
        value === undefined || value === '' || value === 'NULL' || value === 'undefined' ? null : value
      ])
    );

    // Create the transformed category with explicit null checks for each field
    const transformed = {
      product_id: cleanCategory.product_id || null,
      search_url: cleanCategory.search_url || null,
      category_tree: cleanCategory.category_tree,
      product_url: cleanCategory.product_url || null,
      product_name: cleanCategory.product_name || null,
      is_ad: cleanCategory.is_ad === 'Y' || cleanCategory.is_ad === true,
      star_seller: cleanCategory.star_seller === 'Y' || cleanCategory.star_seller === true,
      store_reviews_number: cleanCategory.store_reviews_number ? parseInt(cleanCategory.store_reviews_number) : null,
      store_reviews_score: cleanCategory.store_reviews_score ? parseInt(cleanCategory.store_reviews_score) : null,
      store_name: cleanCategory.store_name || null,
      store_url: cleanCategory.store_url || null,
      time_added: new Date()
    };

    return transformed;
  });

  try {
    const result = await sql`
      INSERT INTO categories ${sql(transformedCategories, 
        'product_id',
        'search_url',
        'category_tree',
        'product_url',
        'product_name',
        'is_ad',
        'star_seller',
        'store_reviews_number',
        'store_reviews_score',
        'store_name',
        'store_url',
        'time_added'
      )}
      RETURNING id
    `;
    
    logger(`Successfully inserted ${result.length} categories`);
    res.json({ 
      message: "Categories added successfully", 
      count: result.length,
      ids: result.map(row => row.id)
    });
  } catch (error) {
    logger(`Error inserting categories: ${error.message}`);
    throw { status: 500, message: "Failed to insert categories", error: error.message };
  }
}));

// app.post("/get-rows", asyncHandler(async (req, res) => {

//   const { table, start, count } = req.body;

//   if(['products', 'stores', 'categories'].includes(table)) {
//     // Create the queries using the validated table name directly
//     const query = `SELECT * FROM ${table} LIMIT $1 OFFSET $2`;
//     const countQuery = `SELECT COUNT(*) FROM ${table}`;

//     const [result, totalCount] = await Promise.all([
//       sql.unsafe(query, [count, start]),
//       sql.unsafe(countQuery)
//     ]);
    
//     res.json({
//       data: result,
//       totalCount: totalCount[0].count
//     });
//   } else {
//     throw { status: 400, message: "Invalid table name" };
//   }
// }));


// ... existing code ...

app.post("/get-rows", asyncHandler(async (req, res) => {
  const { table, start, count, filters } = req.body;

  if(['products', 'stores','categories'].includes(table)) {
    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    if (filters) {
      // Date filters
      const dateFields = {
        products: ['time_scraped', 'date_of_latest_review', 'date_listed', 'on_etsy_since'],
        stores: ['store_last_updated', 'on_etsy_since']
      };

      if (dateFields[table]) {
        dateFields[table].forEach(field => {
          if (filters[`${field}_from`]) {
            whereClause.push(`${field} >= $${paramIndex}`);
            params.push(new Date(filters[`${field}_from`]));
            paramIndex++;
          }
          if (filters[`${field}_to`]) {
            whereClause.push(`${field} <= $${paramIndex}`);
            params.push(new Date(filters[`${field}_to`]));
            paramIndex++;
          }
        });
      }

      // Numeric range filters
      const numericFields = {
        products: [
          'last_24_hours', 'number_in_basket', 'product_reviews', 'ratingvalue',
          'price_usd', 'sale_price_usd'
        ],
        stores: [
          'store_reviews', 'store_review_score', 'store_sales',
          'store_admirers', 'number_of_store_products'
        ]
      };

      if (numericFields[table]) {
        numericFields[table].forEach(field => {
          if (filters[`${field}_from`]) {
            whereClause.push(`${field} >= $${paramIndex}`);
            params.push(Number(filters[`${field}_from`]));
            paramIndex++;
          }
          if (filters[`${field}_to`]) {
            whereClause.push(`${field} <= $${paramIndex}`);
            params.push(Number(filters[`${field}_to`]));
            paramIndex++;
          }
        });
      }

      // String filters
      if (filters.store_country) {
        whereClause.push(`store_country ILIKE $${paramIndex}`);
        params.push(filters.store_country);
        paramIndex++;
      }

      // Update the category filter to be exact match
      if (filters.category_name) {
        whereClause.push(`category_name = $${paramIndex}`);
        params.push(filters.category_name);
        paramIndex++;
      }

      // Multiple select filters
      if (filters.categories && Array.isArray(filters.categories)) {
        whereClause.push(`category_name = ANY($${paramIndex})`);
        params.push(filters.categories);
        paramIndex++;
      }

      if (filters.brands && Array.isArray(filters.brands)) {
        whereClause.push(`brand = ANY($${paramIndex})`);
        params.push(filters.brands);
        paramIndex++;
      }

      // Boolean filters
      const booleanFields = {
        products: ['ad', 'digital_download', 'star_seller'],
        stores: ['star_seller']
      };

      if (booleanFields[table]) {
        booleanFields[table].forEach(field => {
          if (filters[field] !== undefined) {
            whereClause.push(`${field} = $${paramIndex}`);
            params.push(filters[field]);
            paramIndex++;
          }
        });
      }

      if (filters.jsonSearch && filters.jsonSearch !== '' && filters.jsonSearch !== ' ') {
        if(table === 'products') {  
          whereClause.push(`(
            product_title ILIKE $${paramIndex} 
          )`);
        } else {
          whereClause.push(`(
            welcome_to_our_shop_text ILIKE $${paramIndex} OR 
            store_description ILIKE $${paramIndex} OR
            store_name ILIKE $${paramIndex}

          )`);
        }
        params.push(`%${filters.jsonSearch}%`);
        paramIndex++;
      }
    }

    // Add LIMIT and OFFSET parameters
    params.push(count);
    params.push(start);

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    let query;
    if (table === 'products') {
      // Modified query to join with stores table
      query = `
        SELECT 
          p.*,
          s.*
        FROM products p
        LEFT JOIN stores s ON p.store_name = s.store_name
        ${whereString}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    } else {
      query = `SELECT * FROM ${table} ${whereString} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    }
    const countQuery = `SELECT COUNT(*) FROM ${table} ${whereString}`;

    try {
      const [result, totalCount] = await Promise.all([
        sql.unsafe(query, params),
        sql.unsafe(countQuery, params.slice(0, -2))
      ]);
      
      res.json({
        data: result,
        totalCount: totalCount[0].count
      });
    } catch (error) {
      console.error('Query error:', error);
      throw { status: 500, message: "Database query error", error: error.message };
    }
  } else {
    throw { status: 400, message: "Invalid table name" };
  }
}));



// Get all users
app.get("/users", asyncHandler(async (req, res) => {

  const token = req.headers.auth;

  const decodedToken = jwt.verify(token, tokenSecret);

  console.log("iosAdmin +++++++++++++++++++++++++");
  console.log(decodedToken?.isAdmin);
  console.log("iosAdmin +++++++++++++++++++++++++");

  if(!decodedToken?.isAdmin) {
    throw { status: 401, message: "Unauthorized" };
  }

  const users = await sql`
    SELECT id, email, name, is_admin, prodaccess, storeaccess, prodandstoreaccess, created_at 
    FROM users
  `;
  res.json(users);
}));

// Update user
app.put("/users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, is_admin, prodaccess, storeaccess, prodandstoreaccess } = req.body;
  const token = req.headers.auth;

  const decodedToken = jwt.verify(token, tokenSecret);

  console.log("iosAdmin +++++++++++++++++++++++++");
  console.log(decodedToken?.isAdmin);
  console.log("iosAdmin +++++++++++++++++++++++++");

  if(!decodedToken?.isAdmin) {
    throw { status: 401, message: "Unauthorized" };
  }
  const updatedUser = await sql`
    UPDATE users 
    SET 
      name = ${name},
      email = ${email},
      is_admin = ${is_admin},
      prodaccess = ${prodaccess},
      storeaccess = ${storeaccess},
      prodandstoreaccess = ${prodandstoreaccess}
    WHERE id = ${id}
    RETURNING id, email, name, is_admin, prodaccess, storeaccess, prodandstoreaccess, created_at
  `;

  res.json(updatedUser[0]);
}));

async function addUserToDb(data) {
  try {
    if (!data.email || !data.password) {
      throw { status: 400, message: "Missing required worker data" };
    }

    const existingWorker = await sql`
        SELECT id FROM users WHERE email = ${data.email}
      `
      .then((rows) => rows[0])
      .catch((err) => {
        logger(`Database error while finding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    if (existingWorker) {
      throw { status: 409, message: "User with this email already exists" };
    }

    const result = await sql`
        INSERT INTO users (
          email, 
          password, 
          name, 
          is_admin, 
          prodAccess,
          storeAccess,
          prodAndStoreAccess,
          created_at
        ) VALUES (
          ${data.email}, 
          ${data.password}, 
          ${data.name}, 
          ${data.isAdmin}, 
          false,
          false,
          false,
          ${new Date()}
        ) RETURNING id
      `
      .then((rows) => rows[0])
      .catch((err) => {
        logger(`Database error while adding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    logger(`New user added with ID: ${result.id}`);
    return result.id;
  } catch (error) {
    logger(`Error in addWorkerToDb: ${error.message}`);
    throw error;
  }
}

// Add new endpoint to get filter options
app.get("/filter-options/:table", asyncHandler(async (req, res) => {
  const { table } = req.params;

  if (!['products', 'stores'].includes(table)) {
    throw { status: 400, message: "Invalid table name" };
  }

  const options = {
    countries: await sql`SELECT DISTINCT store_country FROM ${sql(table)} WHERE store_country IS NOT NULL ORDER BY store_country`,
    categories: table === 'products' ? await sql`SELECT DISTINCT category_name FROM products WHERE category_name IS NOT NULL ORDER BY category_name` : [],
    brands: table === 'products' ? await sql`SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand` : []
  };

  res.json(options);
}));

// Get upload history
app.get("/upload-history", asyncHandler(async (req, res) => {
  const history = await sql`
    SELECT * FROM upload_history 
    ORDER BY time_added DESC 
    LIMIT 100
  `;
  res.json(history);
}));

// Add upload history entry
app.post("/upload-history", asyncHandler(async (req, res) => {
  const { file_type, rows_processed, status, error_message = null } = req.body;
  
  const result = await sql`
    INSERT INTO upload_history (
      file_type, 
      rows_processed, 
      status, 
      error_message
    ) VALUES (
      ${file_type}, 
      ${rows_processed}, 
      ${status}, 
      ${error_message}
    ) RETURNING *
  `;
  
  res.json(result[0]);
}));

// Get field history for a product
app.get("/product-history/:productId/:field", asyncHandler(async (req, res) => {
  const { productId, field } = req.params;
  
  // Validate field to prevent SQL injection
  // const allowedFields = [
  //   'last_24_hours',
  //   'number_in_basket',
  //   'product_reviews',
  //   'ratingvalue',
  //   'number_of_favourties',
  //   'price_usd',
  //   'sale_price_usd',
  //   'store_reviews'
  // ];

  // if (!allowedFields.includes(field)) {
  //   throw { status: 400, message: "Invalid field name" };
  // }

  const history = await sql`
    SELECT ${sql(field)}, time_added
    FROM products
    WHERE product_id = ${productId}
    ORDER BY time_added DESC
  `;

  res.json(history);
}));

// Update the store history endpoint to use store_name
app.get("/store-history/:storeName/:field", asyncHandler(async (req, res) => {
  const { storeName, field } = req.params;
  
  // Validate field to prevent SQL injection
  const allowedFields = [
    'store_reviews',
    'store_review_score',
    'store_sales',
    'store_admirers',
    'number_of_store_products'
  ];

  if (!allowedFields.includes(field)) {
    throw { status: 400, message: "Invalid field name" };
  }

  const history = await sql`
    SELECT ${sql(field)}, time_added
    FROM stores
    WHERE store_name = ${decodeURIComponent(storeName)}
    ORDER BY time_added DESC
  `;

  res.json(history);
}));

// Add new export endpoint
app.post("/export-data", asyncHandler(async (req, res) => {
  const { table, filters } = req.body;

  if (!['products', 'stores'].includes(table)) {
    throw { status: 400, message: "Invalid table name" };
  }

  let whereClause = [];
  let params = [];
  let paramIndex = 1;

  if (filters) {
    // Date filters
    const dateFields = {
      products: ['time_scraped', 'date_of_latest_review', 'date_listed', 'on_etsy_since'],
      stores: ['store_last_updated', 'on_etsy_since']
    };

    if (dateFields[table]) {
      dateFields[table].forEach(field => {
        if (filters[`${field}_from`]) {
          whereClause.push(`${field} >= $${paramIndex}`);
          params.push(new Date(filters[`${field}_from`]));
          paramIndex++;
        }
        if (filters[`${field}_to`]) {
          whereClause.push(`${field} <= $${paramIndex}`);
          params.push(new Date(filters[`${field}_to`]));
          paramIndex++;
        }
      });
    }

    // Numeric range filters
    const numericFields = {
      products: [
        'last_24_hours', 'number_in_basket', 'product_reviews', 'ratingvalue',
        'number_of_favourties', 'price_usd', 'sale_price_usd', 'store_reviews',
        'store_sales', 'store_admirers', 'number_of_store_products'
      ],
      stores: [
        'store_reviews', 'store_review_score', 'store_sales',
        'store_admirers', 'number_of_store_products'
      ]
    };

    if (numericFields[table]) {
      numericFields[table].forEach(field => {
        if (filters[`${field}_from`]) {
          whereClause.push(`${field} >= $${paramIndex}`);
          params.push(Number(filters[`${field}_from`]));
          paramIndex++;
        }
        if (filters[`${field}_to`]) {
          whereClause.push(`${field} <= $${paramIndex}`);
          params.push(Number(filters[`${field}_to`]));
          paramIndex++;
        }
      });
    }

    // String filters
    if (filters.store_country) {
      whereClause.push(`store_country ILIKE $${paramIndex}`);
      params.push(filters.store_country);
      paramIndex++;
    }

    if (filters.category) {
      whereClause.push(`category_name ILIKE $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.brand) {
      whereClause.push(`brand ILIKE $${paramIndex}`);
      params.push(filters.brand);
      paramIndex++;
    }

    // Boolean filters
    if (filters.star_seller !== undefined) {
      whereClause.push(`star_seller = $${paramIndex}`);
      params.push(filters.star_seller);
      paramIndex++;
    }

    if (filters.ad !== undefined) {
      whereClause.push(`ad = $${paramIndex}`);
      params.push(filters.ad);
      paramIndex++;
    }

    if (filters.digital_download !== undefined) {
      whereClause.push(`digital_download = $${paramIndex}`);
      params.push(filters.digital_download);
      paramIndex++;
    }
    if (filters.jsonSearch && filters.jsonSearch !== '' && filters.jsonSearch !== ' ') {

      if(table === 'products') {  
        console.log("products search");
        whereClause.push(`(
          product_title ILIKE $${paramIndex} 
        )`);
      }else {
        console.log("stores search");
        whereClause.push(`(
          welcome_to_our_shop_text ILIKE $${paramIndex} OR 
          store_description ILIKE $${paramIndex}
        )`);
      }
  
      
      params.push(`%${filters.jsonSearch}%`);
      paramIndex++;
    }
  }

  const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
  const query = `SELECT * FROM ${table} ${whereString}`;

  try {
    const result = await sql.unsafe(query, params);
    res.json(result);
  } catch (error) {
    console.error('Export query error:', error);
    throw { status: 500, message: "Database query error", error: error.message };
  }
}));

// Add new function to process category tree
async function processCategoryTree(categoryTree) {
  // Split the tree into individual categories
  const categories = categoryTree
    .replace(/[<>]/g, '>') // Convert all separators to '>'
    .split('>')
    .map(c => c.trim())
    .filter(Boolean);

  let parentId = null;
  let level = 0;

  // Process each category in the tree
  for (const category of categories) {
    try {
      // Try to find existing category at this level with this parent
      let existingCategory = await sql`
        SELECT id FROM category_hierarchy 
        WHERE category_name = ${category} 
        AND COALESCE(parent_id, 0) = COALESCE(${parentId}, 0)
        AND level = ${level}
      `;

      if (existingCategory.length === 0) {
        // Category doesn't exist at this level, create it
        existingCategory = await sql`
          INSERT INTO category_hierarchy (category_name, parent_id, level)
          VALUES (${category}, ${parentId}, ${level})
          RETURNING id
        `;
      }

      parentId = existingCategory[0].id;
      level++;
    } catch (error) {
      console.error('Error processing category:', error);
      throw error;
    }
  }
}

// Add new endpoint to get category hierarchy
app.get("/category-hierarchy/:parentId?", asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  
  const categories = await sql`
    SELECT id, category_name, level
    FROM category_hierarchy
    WHERE COALESCE(parent_id, 0) = COALESCE(${parentId ? parseInt(parentId) : null}, 0)
    ORDER BY category_name
  `;
  
  res.json(categories);
}));

console.log("server running on port 3000");
// server.listen(8000);
app.listen(8000);

function logger(msg) {
    console.log(`[${new Date().toISOString()}] |  ${msg}`);
  }
  