import { randomBytes } from "crypto";


export default class StringUtilService {

    public generateRamdomString(length = 3): string {
        return randomBytes(length)
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, length)
            .toLowerCase();
    }

}