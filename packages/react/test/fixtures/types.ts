export interface UserModelType {
  id: string;
  name: string;
  email: string;
}

export interface PostModelType {
  id: string;
  userId: string;
  title: string;
}

export interface UserRelations {
  posts: PostModelType[];
}

export interface PostRelations {
  author: UserModelType | null;
}
