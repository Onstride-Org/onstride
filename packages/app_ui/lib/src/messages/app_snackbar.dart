// // ignore_for_file: public_member_api_docs
//
// import 'package:flutter/material.dart';
//
// mixin AppSnackBar {
//   static void success(BuildContext context, {required String message}) {
//     ScaffoldMessenger.of(context).showSnackBar(
//       SnackBar(
//         backgroundColor: Colors.green[600],
//         content: Text(
//           message,
//           style: Theme.of(context)
//               .textTheme
//               .bodyMedium!
//               .copyWith(color: Colors.white, fontWeight: FontWeight.w700),
//         ),
//         margin: const EdgeInsets.symmetric(vertical: 15, horizontal: 10),
//         behavior: SnackBarBehavior.floating,
//         duration: const Duration(seconds: 5),
//         shape: const StadiumBorder(),
//         dismissDirection: DismissDirection.horizontal,
//       ),
//     );
//   }
//
//   static void error(BuildContext context, {required String error}) {
//     ScaffoldMessenger.of(context).showSnackBar(
//       SnackBar(
//         backgroundColor: Theme.of(context).colorScheme.error,
//         content: Text(
//           error,
//           style: Theme.of(context)
//               .textTheme
//               .bodyMedium!
//               .copyWith(color: Colors.white, fontWeight: FontWeight.w700),
//         ),
//         margin: const EdgeInsets.symmetric(vertical: 15, horizontal: 10),
//         behavior: SnackBarBehavior.floating,
//         duration: const Duration(seconds: 5),
//         shape: const StadiumBorder(),
//         dismissDirection: DismissDirection.horizontal,
//       ),
//     );
//   }
// }
