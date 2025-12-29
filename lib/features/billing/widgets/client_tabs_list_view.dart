import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// List view for displaying client tabs/balances.
class ClientTabsListView extends ConsumerWidget {
  const ClientTabsListView({
    required this.tabs,
    super.key,
  });

  final List<ClientTabModel> tabs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currencyFormat = NumberFormat.currency(symbol: r'$');

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tabs.length,
      itemBuilder: (context, index) {
        final tab = tabs[index];
        final hasBalance = tab.totalBalance > 0;
        final isOverdue = tab.hasOverdue;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: hasBalance
                  ? (isOverdue ? Colors.red : Colors.orange)
                  : Colors.green,
              child: Icon(
                hasBalance ? Icons.warning : Icons.check,
                color: Colors.white,
              ),
            ),
            title: Text(
              tab.clientName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (tab.lastPaymentDate != null)
                  Text(
                    'Last payment: ${DateFormat.yMMMd().format(tab.lastPaymentDate!)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                if (isOverdue)
                  Text(
                    'Overdue',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  currencyFormat.format(tab.totalBalance),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: hasBalance ? Colors.red : Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Balance',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            onTap: () {
              // Navigate to client tab details
            },
          ),
        );
      },
    );
  }
}
