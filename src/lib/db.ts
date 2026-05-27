/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient, ObjectId } from "mongodb";
import {
  BOOKING_STATUSES,
  ORDER_STATUSES,
  type BookingStatus,
  type OrderStatus,
  type Role,
  type UserStatus,
} from "./roles";

const uri =
  process.env.DATABASE_URL || "mongodb://127.0.0.1:27018/borama_food_delivery";

let clientPromise: Promise<MongoClient> | null = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof ObjectId)
  );
}

function toObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) {
    return value;
  }
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return null;
}

function normalizeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value))
    return value.map((item) => normalizeValue(key, item));
  if (isPlainObject(value)) {
    if ("gte" in value || "lte" in value || "gt" in value || "lt" in value) {
      const out: Record<string, unknown> = {};
      if (value.gte !== undefined) out.$gte = normalizeValue(key, value.gte);
      if (value.lte !== undefined) out.$lte = normalizeValue(key, value.lte);
      if (value.gt !== undefined) out.$gt = normalizeValue(key, value.gt);
      if (value.lt !== undefined) out.$lt = normalizeValue(key, value.lt);
      return out;
    }
    if ("contains" in value) {
      const text = String(value.contains ?? "");
      return { $regex: escapeRegex(text), $options: "i" };
    }
    if ("in" in value && Array.isArray(value.in)) {
      return { $in: value.in.map((item) => normalizeValue(key, item)) };
    }
    return value;
  }
  if (typeof value === "string" && (key === "id" || key.endsWith("Id"))) {
    return toObjectId(value);
  }
  return value;
}

function buildFilter(where: Record<string, unknown> = {}) {
  const filter: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === "OR" && Array.isArray(value)) {
      filter.$or = value.map((entry) =>
        buildFilter(entry as Record<string, unknown>),
      );
      continue;
    }
    if (key === "AND" && Array.isArray(value)) {
      filter.$and = value.map((entry) =>
        buildFilter(entry as Record<string, unknown>),
      );
      continue;
    }

    if (key === "id") {
      filter._id = normalizeValue(key, value);
      continue;
    }

    filter[key] = normalizeValue(key, value);
  }

  return filter;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDocument<T>(value: T): T {
  if (value instanceof ObjectId) return value.toHexString() as T;
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value))
    return value.map((item) => normalizeDocument(item)) as T;
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "_id") {
      out.id = normalizeDocument(nested);
      continue;
    }
    out[key] = normalizeDocument(nested);
  }
  return out as T;
}

function applySelect<T extends Record<string, unknown>>(
  doc: T,
  select?: Record<string, unknown>,
): T {
  if (!select) return doc;
  const keys = Object.entries(select)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);
  if (!keys.length) return doc;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in doc) out[key] = doc[key];
  }
  return out as T;
}

function buildSort(
  orderBy?: Record<string, "asc" | "desc">,
): [string, 1 | -1][] | undefined {
  if (!orderBy) return undefined;
  const entries = Object.entries(orderBy);
  if (!entries.length) return undefined;
  const [field, direction] = entries[0];
  return [[field, direction === "desc" ? -1 : 1]];
}

async function queryCollection(
  name: string,
  options: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
  } = {},
) {
  const db = await getDb();
  const cursor = db.collection(name).find(buildFilter(options.where));
  const sort = buildSort(options.orderBy);
  if (sort) cursor.sort(sort);
  if (options.take) cursor.limit(options.take);
  const docs = await cursor.toArray();
  return docs.map((doc) => normalizeDocument(doc));
}

async function findOne(
  name: string,
  options: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
  } = {},
) {
  const [doc] = await queryCollection(name, { ...options, take: 1 });
  return doc ?? null;
}

async function populateUser(
  user: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!user) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(user) };

  if (include?.restaurant) {
    const restaurant = await db
      .collection("restaurants")
      .findOne({ ownerId: toObjectId(out.id) });
    out.restaurant = restaurant
      ? await populateRestaurant(
          restaurant,
          include.restaurant === true ? undefined : include.restaurant,
        )
      : null;
  }

  if (include?.driverDocuments) {
    const docs = await queryCollection("driverDocuments", {
      where: { driverId: out.id },
    });
    out.driverDocuments = docs;
  }

  if (include?.bookings) {
    const bookings = await queryCollection("bookings", {
      where: { customerId: out.id },
    });
    out.bookings = bookings;
  }

  if (include?.orders) {
    const orders = await queryCollection("orders", {
      where: { customerId: out.id },
    });
    out.orders = orders;
  }

  return applySelect(out as any, select);
}

async function populateMenuCategory(
  category: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!category) return null;
  const out: Record<string, unknown> = { ...normalizeDocument(category) };
  if (include?.items) {
    const items = await queryCollection("menuItems", {
      where: { categoryId: out.id },
    });
    out.items = items;
  }
  return applySelect(out as any, select);
}

async function populateMenuItem(
  item: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!item) return null;
  const out: Record<string, unknown> = { ...normalizeDocument(item) };
  const db = await getDb();

  if (include?.category) {
    const categoryId = toObjectId(out.categoryId);
    const category = categoryId
      ? await db.collection("menuCategories").findOne({ _id: categoryId })
      : null;
    out.category = category
      ? await populateMenuCategory(
          category,
          include.category === true ? undefined : include.category,
        )
      : null;
  }

  return applySelect(out as any, select);
}

async function populateOrderItem(item: any, include?: any) {
  const out: Record<string, unknown> = { ...normalizeDocument(item) };
  if (include?.menuItem) {
    const db = await getDb();
    const menuItemId = toObjectId(out.menuItemId);
    const menuItem = menuItemId
      ? await db.collection("menuItems").findOne({ _id: menuItemId })
      : null;
    out.menuItem = menuItem
      ? await populateMenuItem(
          menuItem,
          include.menuItem === true ? undefined : include.menuItem,
        )
      : null;
  }
  return out;
}

async function populateOrder(
  order: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!order) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(order) };

  if (include?.items) {
    const items = await queryCollection("orderItems", {
      where: { orderId: out.id },
    });
    out.items = await Promise.all(
      items.map((item) =>
        populateOrderItem(
          item,
          include.items === true ? undefined : include.items.include,
        ),
      ),
    );
  }

  if (include?.restaurant) {
    const restaurantId = toObjectId(out.restaurantId);
    const restaurant = restaurantId
      ? await db.collection("restaurants").findOne({ _id: restaurantId })
      : null;
    out.restaurant = restaurant
      ? await populateRestaurant(
          restaurant,
          include.restaurant === true ? undefined : include.restaurant,
        )
      : null;
  }

  if (include?.customer) {
    const customerId = toObjectId(out.customerId);
    const customer = customerId
      ? await db.collection("users").findOne({ _id: customerId })
      : null;
    out.customer = customer
      ? applySelect(
          (await populateUser(
            customer,
            include.customer.include,
            include.customer.select,
          )) as any,
          include.customer.select,
        )
      : null;
  }

  if (include?.driver) {
    const driverId = out.driverId;
    if (driverId) {
      const lookupId = toObjectId(driverId);
      const driver = lookupId
        ? await db.collection("users").findOne({ _id: lookupId })
        : null;
      out.driver = driver
        ? applySelect(
            (await populateUser(
              driver,
              include.driver.include,
              include.driver.select,
            )) as any,
            include.driver.select,
          )
        : null;
    } else {
      out.driver = null;
    }
  }

  return applySelect(out as any, select);
}

async function populateBooking(
  booking: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!booking) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(booking) };

  if (include?.restaurant) {
    const restaurantId = toObjectId(out.restaurantId);
    const restaurant = restaurantId
      ? await db.collection("restaurants").findOne({ _id: restaurantId })
      : null;
    out.restaurant = restaurant
      ? await populateRestaurant(
          restaurant,
          include.restaurant === true ? undefined : include.restaurant,
        )
      : null;
  }

  if (include?.table) {
    const tableId = toObjectId(out.tableId);
    const table = tableId
      ? await db.collection("restaurantTables").findOne({ _id: tableId })
      : null;
    out.table = table ? normalizeDocument(table) : null;
  }

  if (include?.customer) {
    const customerId = toObjectId(out.customerId);
    const customer = customerId
      ? await db.collection("users").findOne({ _id: customerId })
      : null;
    out.customer = customer
      ? applySelect(
          (await populateUser(
            customer,
            include.customer.include,
            include.customer.select,
          )) as any,
          include.customer.select,
        )
      : null;
  }

  return applySelect(out as any, select);
}

async function populateMessage(
  message: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!message) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(message) };

  if (include?.sender) {
    const senderId = toObjectId(out.senderId);
    const sender = senderId
      ? await db.collection("users").findOne({ _id: senderId })
      : null;
    out.sender = sender
      ? applySelect(normalizeDocument(sender), include.sender.select)
      : null;
  }

  if (include?.receiver) {
    const receiverId = toObjectId(out.receiverId);
    const receiver = receiverId
      ? await db.collection("users").findOne({ _id: receiverId })
      : null;
    out.receiver = receiver
      ? applySelect(normalizeDocument(receiver), include.receiver.select)
      : null;
  }

  return applySelect(out as any, select);
}

async function populateRestaurant(
  restaurant: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!restaurant) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(restaurant) };

  if (include?.menuItems) {
    const where = { restaurantId: out.id, ...(include.menuItems.where || {}) };
    let items = await queryCollection("menuItems", {
      where,
      take: include.menuItems.take,
      orderBy: include.menuItems.orderBy,
    });
    if (include.menuItems.select)
      items = items.map((item) =>
        applySelect(item as any, include.menuItems.select),
      );
    out.menuItems = items;
  }

  if (include?.categories) {
    let categories = await queryCollection("menuCategories", {
      where: { restaurantId: out.id },
    });
    if (include.categories.include?.items) {
      categories = await Promise.all(
        categories.map((category) =>
          populateMenuCategory(
            category,
            include.categories.include,
            include.categories.select,
          ),
        ),
      );
    } else if (include.categories.select) {
      categories = categories.map((category) =>
        applySelect(category as any, include.categories.select),
      );
    }
    out.categories = categories;
  }

  if (include?.tables) {
    out.tables = await queryCollection("restaurantTables", {
      where: { restaurantId: out.id },
    });
  }

  if (include?.timeSlots) {
    out.timeSlots = await queryCollection("timeSlots", {
      where: { restaurantId: out.id },
    });
  }

  if (include?.orders) {
    let orders = await queryCollection("orders", {
      where: { restaurantId: out.id },
      orderBy: include.orders.orderBy,
    });
    orders = await Promise.all(
      orders.map((order) =>
        populateOrder(order, include.orders.include, include.orders.select),
      ),
    );
    out.orders = orders;
  }

  if (include?.bookings) {
    let bookings = await queryCollection("bookings", {
      where: { restaurantId: out.id },
      orderBy: include.bookings.orderBy,
    });
    bookings = await Promise.all(
      bookings.map((booking) =>
        populateBooking(
          booking,
          include.bookings.include,
          include.bookings.select,
        ),
      ),
    );
    out.bookings = bookings;
  }

  if (include?._count?.select?.menuItems) {
    out._count = {
      menuItems: await db
        .collection("menuItems")
        .countDocuments({ restaurantId: toObjectId(out.id) }),
    };
  }

  return applySelect(out as any, select);
}

async function populateTransaction(
  transaction: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!transaction) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(transaction) };
  if (include?.order) {
    const orderId = toObjectId(out.orderId);
    const order = orderId
      ? await db.collection("orders").findOne({ _id: orderId })
      : null;
    out.order = order
      ? await populateOrder(
          order,
          include.order === true ? undefined : include.order,
        )
      : null;
  }
  return applySelect(out as any, select);
}

async function populateDispute(
  dispute: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!dispute) return null;
  const db = await getDb();
  const out: Record<string, unknown> = { ...normalizeDocument(dispute) };
  if (include?.order) {
    const orderId = toObjectId(out.orderId);
    const order = orderId
      ? await db.collection("orders").findOne({ _id: orderId })
      : null;
    out.order = order
      ? await populateOrder(
          order,
          include.order === true ? undefined : include.order,
        )
      : null;
  }
  return applySelect(out as any, select);
}

async function populateDriverCommission(
  comm: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!comm) return null;
  const out: Record<string, unknown> = { ...normalizeDocument(comm) };
  return applySelect(out as any, select);
}

async function populateDriverDocument(
  doc: any,
  include?: any,
  select?: Record<string, unknown>,
) {
  if (!doc) return null;
  const out: Record<string, unknown> = { ...normalizeDocument(doc) };
  return applySelect(out as any, select);
}

async function populatePlatformMetric(
  metric: any,
  select?: Record<string, unknown>,
) {
  if (!metric) return null;
  return applySelect(normalizeDocument(metric), select);
}

async function maybePopulate<T>(type: string, doc: T, options: any = {}) {
  const include = options.include;
  const select = options.select;
  switch (type) {
    case "user":
      return populateUser(doc, include, select);
    case "restaurant":
      return populateRestaurant(doc, include, select);
    case "menuCategory":
      return populateMenuCategory(doc, include, select);
    case "menuItem":
      return populateMenuItem(doc, include, select);
    case "order":
      return populateOrder(doc, include, select);
    case "booking":
      return populateBooking(doc, include, select);
    case "message":
      return populateMessage(doc, include, select);
    case "transaction":
      return populateTransaction(doc, include, select);
    case "dispute":
      return populateDispute(doc, include, select);
    case "driverCommission":
      return populateDriverCommission(doc, include, select);
    case "driverDocument":
      return populateDriverDocument(doc, include, select);
    case "platformMetric":
      return populatePlatformMetric(doc, select);
    default:
      return doc ? applySelect(normalizeDocument(doc) as any, select) : null;
  }
}

async function findManyModel(type: string, options: any = {}) {
  const docs = await queryCollection(collectionName(type), options);
  return Promise.all(docs.map((doc) => maybePopulate(type, doc, options)));
}

async function findOneModel(type: string, options: any = {}) {
  const doc = await findOne(collectionName(type), options);
  return maybePopulate(type, doc, options);
}

function collectionName(type: string) {
  switch (type) {
    case "user":
      return "users";
    case "restaurant":
      return "restaurants";
    case "menuCategory":
      return "menuCategories";
    case "menuItem":
      return "menuItems";
    case "restaurantTable":
      return "restaurantTables";
    case "timeSlot":
      return "timeSlots";
    case "order":
      return "orders";
    case "orderItem":
      return "orderItems";
    case "booking":
      return "bookings";
    case "driverDocument":
      return "driverDocuments";
    case "driverCommission":
      return "driverCommissions";
    case "transaction":
      return "transactions";
    case "dispute":
      return "disputes";
    case "message":
      return "messages";
    case "platformMetric":
      return "platformMetrics";
    default:
      return type;
  }
}

async function insertOneModel(type: string, data: any, options: any = {}) {
  const db = await getDb();
  const coll = db.collection(collectionName(type));
  const payload = prepareWriteData(data);
  const result = await coll.insertOne(payload);
  const doc = await coll.findOne({ _id: result.insertedId });
  return maybePopulate(type, doc, options);
}

function prepareWriteData(data: any): any {
  if (Array.isArray(data)) return data.map(prepareWriteData);
  if (!isPlainObject(data)) return data;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "id") continue;
    if (
      key === "items" &&
      isPlainObject(value) &&
      Array.isArray((value as any).create)
    ) {
      out.items = (value as any).create.map((item: unknown) =>
        prepareWriteData(item),
      );
      continue;
    }
    if (
      key.endsWith("Id") ||
      key === "ownerId" ||
      key === "customerId" ||
      key === "driverId" ||
      key === "restaurantId" ||
      key === "orderId" ||
      key === "senderId" ||
      key === "receiverId" ||
      key === "tableId" ||
      key === "categoryId" ||
      key === "menuItemId"
    ) {
      out[key] = toObjectId(value);
      continue;
    }
    out[key] = prepareWriteData(value);
  }
  return out;
}

async function updateOneModel(
  type: string,
  where: Record<string, unknown>,
  data: any,
  options: any = {},
) {
  const db = await getDb();
  const coll = db.collection(collectionName(type));
  const filter = buildFilter(where);
  const payload = prepareWriteData(data);
  delete (payload as Record<string, unknown>).items;
  await coll.updateOne(filter, { $set: payload });
  const doc = await coll.findOne(filter);
  return maybePopulate(type, doc, options);
}

async function deleteOneModel(type: string, where: Record<string, unknown>) {
  const db = await getDb();
  await db.collection(collectionName(type)).deleteOne(buildFilter(where));
}

async function countModel(type: string, where: Record<string, unknown> = {}) {
  const db = await getDb();
  return db.collection(collectionName(type)).countDocuments(buildFilter(where));
}

async function aggregateModel(type: string, options: any = {}) {
  const docs = await queryCollection(collectionName(type), {
    where: options.where,
    orderBy: options.orderBy,
    take: options.take,
  });
  const sumField = options._sum ? Object.keys(options._sum)[0] : undefined;
  const sum = sumField
    ? docs.reduce(
        (total, doc) => total + Number((doc as any)[sumField] || 0),
        0,
      )
    : 0;
  const count = docs.length;
  return {
    _sum: sumField ? { [sumField]: sum } : {},
    _count: options._count ? count : undefined,
  };
}

async function upsertModel(
  type: string,
  where: Record<string, unknown>,
  create: any,
  update: any,
  options: any = {},
) {
  const db = await getDb();
  const coll = db.collection(collectionName(type));
  const filter = buildFilter(where);
  const existing = await coll.findOne(filter);
  if (existing) {
    await coll.updateOne(filter, { $set: prepareWriteData(update) });
  } else {
    await coll.insertOne(prepareWriteData(create));
  }
  const doc = await coll.findOne(filter);
  return maybePopulate(type, doc, options);
}

async function createManyModel(type: string, data: any[]) {
  const db = await getDb();
  if (!data.length) return { count: 0 };
  await db
    .collection(collectionName(type))
    .insertMany(data.map(prepareWriteData));
  return { count: data.length };
}

async function updateManyModel(
  type: string,
  where: Record<string, unknown>,
  data: any,
) {
  const db = await getDb();
  const result = await db
    .collection(collectionName(type))
    .updateMany(buildFilter(where), { $set: prepareWriteData(data) });
  return { count: result.modifiedCount };
}

async function createOrder(data: any, options: any = {}) {
  const db = await getDb();
  const { items, ...rest } = data ?? {};
  const payload = prepareWriteData(rest);
  const insert = await db.collection("orders").insertOne(payload);
  const orderId = insert.insertedId;

  const orderItems = Array.isArray(items?.create) ? items.create : [];
  if (orderItems.length) {
    await db.collection("orderItems").insertMany(
      orderItems.map((item: any) => ({
        ...prepareWriteData(item),
        orderId,
      })),
    );
  }

  const doc = await db.collection("orders").findOne({ _id: orderId });
  return maybePopulate("order", doc, options);
}

async function updateOrder(
  where: Record<string, unknown>,
  data: any,
  options: any = {},
) {
  const db = await getDb();
  const coll = db.collection("orders");
  const filter = buildFilter(where);
  await coll.updateOne(filter, { $set: prepareWriteData(data) });
  const doc = await coll.findOne(filter);
  return maybePopulate("order", doc, options);
}

export const db = {
  user: {
    findUnique: (options: any) => findOneModel("user", options),
    findFirst: (options: any) => findOneModel("user", options),
    findMany: (options: any) => findManyModel("user", options),
    create: (options: any) => insertOneModel("user", options.data, options),
    update: (options: any) =>
      updateOneModel("user", options.where, options.data, options),
    count: (options?: any) => countModel("user", options?.where),
  },
  restaurant: {
    findUnique: (options: any) => findOneModel("restaurant", options),
    findFirst: (options: any) => findOneModel("restaurant", options),
    findMany: (options: any) => findManyModel("restaurant", options),
    create: (options: any) =>
      insertOneModel("restaurant", options.data, options),
    update: (options: any) =>
      updateOneModel("restaurant", options.where, options.data, options),
    count: (options?: any) => countModel("restaurant", options?.where),
  },
  menuCategory: {
    findMany: (options: any) => findManyModel("menuCategory", options),
    create: (options: any) =>
      insertOneModel("menuCategory", options.data, options),
    update: (options: any) =>
      updateOneModel("menuCategory", options.where, options.data, options),
    delete: (options: any) => deleteOneModel("menuCategory", options.where),
  },
  menuItem: {
    findMany: (options: any) => findManyModel("menuItem", options),
    create: (options: any) => insertOneModel("menuItem", options.data, options),
    update: (options: any) =>
      updateOneModel("menuItem", options.where, options.data, options),
    updateMany: (options: any) =>
      updateManyModel("menuItem", options.where, options.data),
    delete: (options: any) => deleteOneModel("menuItem", options.where),
  },
  restaurantTable: {
    create: (options: any) =>
      insertOneModel("restaurantTable", options.data, options),
  },
  timeSlot: {
    create: (options: any) => insertOneModel("timeSlot", options.data, options),
    delete: (options: any) => deleteOneModel("timeSlot", options.where),
  },
  order: {
    findUnique: (options: any) => findOneModel("order", options),
    findFirst: (options: any) => findOneModel("order", options),
    findMany: (options: any) => findManyModel("order", options),
    create: (options: any) => createOrder(options.data, options),
    update: (options: any) => updateOrder(options.where, options.data, options),
    aggregate: (options: any) => aggregateModel("order", options),
    count: (options?: any) => countModel("order", options?.where),
  },
  message: {
    findMany: (options: any) => findManyModel("message", options),
    create: (options: any) => insertOneModel("message", options.data, options),
  },
  booking: {
    findMany: (options: any) => findManyModel("booking", options),
    create: (options: any) => insertOneModel("booking", options.data, options),
    update: (options: any) =>
      updateOneModel("booking", options.where, options.data, options),
  },
  driverDocument: {
    findMany: (options: any) => findManyModel("driverDocument", options),
    createMany: (options: any) =>
      createManyModel("driverDocument", options.data),
    updateMany: (options: any) =>
      updateManyModel("driverDocument", options.where, options.data),
  },
  driverCommission: {
    findMany: (options: any) => findManyModel("driverCommission", options),
    upsert: (options: any) =>
      upsertModel(
        "driverCommission",
        options.where,
        options.create,
        options.update,
        options,
      ),
  },
  transaction: {
    findMany: (options: any) => findManyModel("transaction", options),
    upsert: (options: any) =>
      upsertModel(
        "transaction",
        options.where,
        options.create,
        options.update,
        options,
      ),
    aggregate: (options: any) => aggregateModel("transaction", options),
  },
  dispute: {
    findMany: (options: any) => findManyModel("dispute", options),
    count: (options?: any) => countModel("dispute", options?.where),
    upsert: (options: any) =>
      upsertModel(
        "dispute",
        options.where,
        options.create,
        options.update,
        options,
      ),
  },
  platformMetric: {
    findMany: (options: any = {}) => findManyModel("platformMetric", options),
  },
  $runCommandRaw: async (command: Record<string, unknown>) => {
    const db = await getDb();
    return db.command(command);
  },
  $disconnect: async () => {
    if (!clientPromise) return;
    const client = await clientPromise;
    await client.close();
    clientPromise = null;
  },
};

export type DbClient = typeof db;
export {
  ORDER_STATUSES,
  BOOKING_STATUSES,
  type Role,
  type UserStatus,
  type OrderStatus,
  type BookingStatus,
};
