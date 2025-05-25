const { getDb } = require("../config/database")

/**
 * Contact Schema
 * {
 *   _id: ObjectId,
 *   name: String,
 *   phone: String,
 *   email: String,
 *   message: String,
 *   createdAt: Date
 * }
 */

exports.createContact = async (contactData) => {
  const db = getDb();
  const newContact = {
    name: contactData.name,
    phone: contactData.phone,
    email: contactData.email,
    message: contactData.message,
    createdAt: new Date(),
  };
  const result = await db.collection("contacts").insertOne(newContact);
  return {
    _id: result.insertedId,
    ...newContact,
  };
};

exports.getAllContacts = async () => {
  const db = getDb();
  const contacts = await db.collection("contacts").find().sort({ createdAt: -1 }).toArray();
  return contacts;
}; 