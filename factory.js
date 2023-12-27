import { db } from "./server";
import { messageObj } from "./errors";

export const validateId = (id) =>{
    if (Number.isNaN(id)) {
        return {
          valid: false,
          messageObj: messageObj.invalid_field_type("id", "integer")
        };
      }
      const client = db.prepare('select * from clients where id = ? limit 1').get(id);
      if (!client) {
        return {
          valid: false,
          messageObj: messageObj.invalid_field_type("id", "integer")
        };
      }
      return {
        valid: true,
      };
}

export const validateStatus = (status)=>{
    if(!Object.values(STATUS).includes(status))return {valid: false}
        return {valid: true}
}
export const validatePriority = (priority) => {
  if (isNaN(priority))return { valid: false };
        return { valid: true, }
}

export const STATUS = {
    backlog: "backlog",
    in_progress: "in-progress",
    complete: "complete"
}