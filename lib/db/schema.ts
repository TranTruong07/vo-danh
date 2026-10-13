// Định nghĩa Schema / Data Models cho Cơ sở dữ liệu

export interface AuthorSchema {
  _id?: string;
  authorId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  gender: "male" | "female";
  createdAt: Date;
  updatedAt: Date;
}
