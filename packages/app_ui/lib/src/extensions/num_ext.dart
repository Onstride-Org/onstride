// ignore_for_file:public_member_api_docs
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

extension NumEdgeInsetsExt on num {
  EdgeInsets get edgeInsetsT => EdgeInsets.only(top: r);

  EdgeInsets get edgeInsetsB => EdgeInsets.only(bottom: r);

  EdgeInsets get edgeInsetsL => EdgeInsets.only(left: r);

  EdgeInsets get edgeInsetsR => EdgeInsets.only(right: r);

  EdgeInsets get edgeInsetsV => EdgeInsets.symmetric(vertical: r);

  EdgeInsets get edgeInsetsH => EdgeInsets.symmetric(horizontal: r);

  EdgeInsets get edgeInsetsA => EdgeInsets.all(r);

  EdgeInsets get shEdgeInsetsT => EdgeInsets.only(top: sh);

  EdgeInsets get shEdgeInsetsB => EdgeInsets.only(bottom: sh);

  EdgeInsets get swEdgeInsetsL => EdgeInsets.only(left: sw);

  EdgeInsets get swEdgeInsetsR => EdgeInsets.only(right: sw);

  EdgeInsets get shEdgeInsetsV => EdgeInsets.symmetric(vertical: sh);

  EdgeInsets get swEdgeInsetsH => EdgeInsets.symmetric(horizontal: sw);

  EdgeInsets get shEdgeInsetsA => EdgeInsets.all(sh);

  EdgeInsets get swEdgeInsetsA => EdgeInsets.all(sw);
}

extension NumListEdgeInsetsExt on List<num> {
  EdgeInsets get edgeInsetsTB {
    assert(length == 2, 'The list must be have only 2 elements');
    return EdgeInsets.only(top: this[0].r, bottom: this[1].r);
  }

  EdgeInsets get edgeInsetsLR {
    assert(length == 2, 'The list must be have only 2 elements');
    return EdgeInsets.only(left: this[0].r, right: this[1].r);
  }

  EdgeInsets get edgeInsetsHV {
    assert(length == 2, 'The list must be have only 2 elements');
    return EdgeInsets.symmetric(horizontal: this[0].r, vertical: this[1].r);
  }

  EdgeInsets get edgeInsetsLTRB {
    assert(length == 4, 'The list must be have only 4 elements');
    return EdgeInsets.fromLTRB(this[0].r, this[1].r, this[2].r, this[3].r);
  }
}

extension NumBorderRadiusExt on num {
  BorderRadius get borderRadiusT =>
      BorderRadius.vertical(top: Radius.circular(r));

  BorderRadius get borderRadiusB =>
      BorderRadius.vertical(bottom: Radius.circular(r));

  BorderRadius get borderRadiusL =>
      BorderRadius.horizontal(left: Radius.circular(r));

  BorderRadius get borderRadiusR =>
      BorderRadius.horizontal(right: Radius.circular(r));

  BorderRadius get borderRadiusTL =>
      BorderRadius.only(topLeft: Radius.circular(r));

  BorderRadius get borderRadiusTR =>
      BorderRadius.only(topRight: Radius.circular(r));

  BorderRadius get borderRadiusBL =>
      BorderRadius.only(bottomLeft: Radius.circular(r));

  BorderRadius get borderRadiusBR =>
      BorderRadius.only(bottomRight: Radius.circular(r));

  BorderRadius get borderRadiusA => BorderRadius.all(Radius.circular(r));
}
