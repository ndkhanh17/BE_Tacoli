const contactModel = require("../models/contact.model")

exports.createContact = async (req, res, next) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !email || !message) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin." });
    }
    const newContact = await contactModel.createContact({ name, phone, email, message });
    res.status(201).json({ success: true, message: "Gửi liên hệ thành công!", data: newContact });
  } catch (error) {
    next(error);
  }
};

exports.getAllContacts = async (req, res, next) => {
  try {
    const contacts = await contactModel.getAllContacts();
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    next(error);
  }
};
 