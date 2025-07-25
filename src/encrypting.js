import bcrypt from "bcrypt";

export const hash = async (password) => {
    return await bcrypt.hash(password, 10);
}