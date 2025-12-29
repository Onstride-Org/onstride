enum AccountType { owner, manager, boarder, groomer, admin }

extension AccountTypeX on AccountType {
  static AccountType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'owner':
        return AccountType.owner;
      case 'manager':
        return AccountType.manager;
      case 'boarder':
        return AccountType.boarder;
      case 'groomer':
        return AccountType.groomer;
      case 'admin':
        return AccountType.admin;
      default:
        throw ArgumentError('Invalid account type: $value');
    }
  }
}
