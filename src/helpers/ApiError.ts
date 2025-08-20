export class AppError extends Error {
    public readonly type: string;
  
    constructor(type: string, message: string) {
      super(message);
      this.type = type;
    }
  }
  