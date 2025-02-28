export class UserDTO {
  constructor(user) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.role = user.role;
    this.isVerified = user.isVerified;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}


export class UserBatchDTO {
  constructor(user) {
    this.id = user.id;
    this.fullName = `${user.firstName} ${user.lastName}`;
    this.role = user.role;
  }
}
