const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const xlsx = require("xlsx");

function parseContacts(io, filePath, callback) {
  const contacts = [];
  const extension = path.extname(filePath).toLowerCase();
  if (io) {
    io.emit(
      "log",
      `Attempting to parse contact file: ${path.basename(filePath)}`
    );
  }
  try {
    if (extension === ".csv") {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          if (row.number) contacts.push(row);
        })
        .on("end", () => callback(null, contacts))
        .on("error", (err) => callback(err, null));
    } else if (extension === ".xlsx" || extension === ".xls") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet);
      callback(
        null,
        jsonData.filter((row) => row.number)
      );
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    callback(error, null);
  }
}

module.exports = { parseContacts };