export class OperationsMapper {
  static valid: any = {
    "default": {
      "valid_ops": ["="]
    },
    "integer": {
      "default": {
        "valid_ops": ["=", ">", "<", "<=", ">="]
      }
    },
    "number": {
      "default": {
        "valid_ops": ["=", ">", "<", "<=", ">="]
      }
    },
    "string": {
      "date": {
        "valid_ops": ["=", ">", "<", "<=", ">="],
        "db_type_coerce": "date"
      },
      "date-time": {
        "valid_ops": ["=", ">", "<", "<=", ">="],
        "db_type_coerce": "timestamp"
      }
    }
  };
}
