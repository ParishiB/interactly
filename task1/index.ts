import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client"; // Assuming you have prisma configured

const app = express();
app.use(express.json());
const prisma = new PrismaClient();
app.post("/createContact", async (req, res) => {
  const { first_name, last_name, email, mobile_number, data_store } = req.body;

  if (!first_name || !last_name || !email || !mobile_number || !data_store) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const postContactToCRM: any = async () => {
    try {
      const response = await axios.post(
        `https://parishi-751830712688631049.myfreshworks.com/crm/sales/api/contacts`,
        {
          contact: {
            first_name,
            last_name,
            email,
            mobile_number,
          },
        },
        {
          headers: {
            Authorization: `Token token=nUJkyw83ZtQXg5kfaNijTw `,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.contact;
    } catch (error: any) {
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
      } else {
        console.error("Error message:", error.message);
      }

      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers["retry-after"] || 30;
        console.log(
          `Rate limit exceeded. Retrying after ${retryAfter} seconds...`
        );
        return new Promise((resolve) =>
          setTimeout(() => resolve(postContactToCRM()), retryAfter * 1000)
        );
      } else {
        throw error;
      }
    }
  };

  try {
    let contact;
    if (data_store === "CRM") {
      contact = await postContactToCRM();
    } else if (data_store === "DATABASE") {
      contact = await prisma.contact.create({
        data: {
          first_name,
          last_name,
          email,
          mobile_number,
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid data_store value" });
    }

    return res
      .status(201)
      .json({ message: "Contact created successfully", contact });
  } catch (error: any) {
    console.error("Error creating contact:", error.message);
    return res
      .status(500)
      .json({ error: "An error occurred while creating the contact" });
  }
});
app.get("/getContact", async (req, res) => {
  const { contact_id, data_store } = req.query;
  try {
    if (data_store === "CRM") {
      const response = await axios.get(
        `https://parishi-751830712688631049.myfreshworks.com/crm/sales/api/contacts${contact_id}`,
        {
          headers: {
            Authorization: `Token token=nUJkyw83ZtQXg5kfaNijTw `,
            "Content-Type": "application/json",
          },
        }
      );
      const contact = response.data.contact;
      return res
        .status(200)
        .json({ message: "Contact fetched successfully", contact });
    } else if (data_store === "DATABASE") {
      const contact = await prisma.contact.findFirst({
        where: { id: Number(contact_id) },
      });
      if (contact) {
        return res
          .status(200)
          .json({ message: "Contact fetched successfully", contact });
      } else {
        return res.status(404).json({ message: "Contact not found" });
      }
    } else {
      return res.status(400).json({ error: "Invalid data_store value" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the contact" });
  }
});
app.put("/updateContact", async (req, res) => {
  const { contact_id, data_store, first_name, last_name, mobile_number } =
    req.body;

  if (!contact_id) {
    return res.status(400).json({ error: "Contact ID not found" });
  }

  const updateData: Partial<{
    first_name: string;
    last_name: string;
    mobile_number: string;
  }> = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (mobile_number) updateData.mobile_number = mobile_number;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    if (data_store === "CRM") {
      const response = await axios.put(
        `https://parishi-751830712688631049.myfreshworks.com/crm/sales/api/contacts${contact_id}`,
        { contact: updateData },
        {
          headers: {
            Authorization: `Token token=nUJkyw83ZtQXg5kfaNijTw `,
            "Content-Type": "application/json",
          },
        }
      );

      const contact = response.data.contact;
      return res
        .status(200)
        .json({ message: "Contact updated successfully in CRM", contact });
    } else if (data_store === "DATABASE") {
      const contact = await prisma.contact.findFirst({
        where: { id: Number(contact_id) },
      });

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      const updatedContact = await prisma.contact.update({
        where: { id: Number(contact_id) },
        data: updateData,
      });

      return res.status(200).json({
        message: "Contact updated successfully in database",
        updatedContact,
      });
    } else {
      return res.status(400).json({ error: "Invalid data_store value" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while updating the contact" });
  }
});
app.delete("/deleteContact", async (req, res) => {
  const { contact_id, data_store } = req.body;
  try {
    if (data_store === "CRM") {
      const response = await axios.delete(
        `https://parishi-751830712688631049.myfreshworks.com/crm/sales/api/contacts${contact_id}`,
        {
          headers: {
            Authorization: `Token token=nUJkyw83ZtQXg5kfaNijTw `,
            "Content-Type": "application/json",
          },
        }
      );

      return res
        .status(200)
        .json({ message: "Contact deleted successfully from CRM" });
    } else if (data_store === "DATABASE") {
      const contact = await prisma.contact.findFirst({
        where: { id: Number(contact_id) },
      });

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      await prisma.contact.delete({
        where: { id: Number(contact_id) },
      });

      return res
        .status(200)
        .json({ message: "Contact deleted successfully from database" });
    } else {
      return res.status(400).json({ error: "Invalid data_store value" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while deleting the contact" });
  }
});
app.listen(4000);
