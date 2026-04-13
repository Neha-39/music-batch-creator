/**
 * Advanced Results Middleware
 * Adds filtering, sorting, field selection, and pagination to any Mongoose model.
 *
 * @param {Model} model - Mongoose Model
 * @param {Object|String} populate - Optional populate config
 */
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // Copy query params
  const reqQuery = { ...req.query };

  // Fields to exclude from filtering
  const removeFields = ["select", "sort", "page", "limit", "search"];
  removeFields.forEach((param) => delete reqQuery[param]);

  // ─── Text Search ─────────────────────────────────────────────────────────────
  let filterQuery = {};
  if (req.query.search) {
    filterQuery.$text = { $search: req.query.search };
  }

  // ─── Comparison Operators ($gt, $gte, $lt, $lte, $in) ────────────────────────
  let queryStr = JSON.stringify({ ...reqQuery, ...filterQuery });
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = model.find(JSON.parse(queryStr));

  // ─── Select Fields ─────────────────────────────────────────────────────────────
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // ─── Sort ──────────────────────────────────────────────────────────────────────
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt"); // default: newest first
  }

  // ─── Populate ──────────────────────────────────────────────────────────────────
  if (populate) {
    query = query.populate(populate);
  }

  // ─── Pagination ────────────────────────────────────────────────────────────────
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Execute query
  const results = await query;

  // Pagination result metadata
  const pagination = { total, page, limit, pages: Math.ceil(total / limit) };

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
