import 'package:flutter/material.dart';

PopupMenuItem buildUserPopup({
  required BuildContext context,
  required String userName,
  required String userEmail,
}) {
  return PopupMenuItem(
    enabled: false,
    padding: EdgeInsets.zero,
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.10),
            offset: Offset(0, 4),
            blurRadius: 6,
            spreadRadius: -4,
          ),
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.10),
            offset: Offset(0, -1),
            blurRadius: 15,
            spreadRadius: 1,
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(userName, style: Theme.of(context).textTheme.bodyMedium),
          Text(
            userEmail,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey),
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () {},
            child: Text('Users', style: Theme.of(context).textTheme.bodyMedium),
          ),
          const Divider(height: 20),
          GestureDetector(
            onTap: () {},
            child: Text(
              'Sign Out',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    ),
  );
}
