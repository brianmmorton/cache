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

export interface ProfileModelType {
  id: string;
  userId: string;
  bio: string;
}

export interface UserRelations {
  posts: PostModelType[];
  profile: ProfileModelType | null;
}

export interface PostRelations {
  author: UserModelType | null;
}

export interface ProfileRelations {
  user: UserModelType | null;
}
