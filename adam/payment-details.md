Fwd: OnStride - Integration Scope Submitted -
Inbox
Summarize this email

Gal Landsberg
Tue, Dec 23, 5:12 PM (5 days ago)
to me



---------- Forwarded message ---------
From: Windcave Developer Support <DevSupport@windcave.com>
Date: Tue, Dec 23, 2025 at 17:11
Subject: Re: OnStride - Integration Scope Submitted -
To: gal@onstrideapp.com <gal@onstrideapp.com>
CC: Mitchell Thompson <Mitchell.Thompson@windcave.com>


Hi Gal,

Thank you for submitting the requirement form. Your REST API account is now set up and ready for testing payment processing via REST API.



Payline – Web Portal

Your account includes access to Payline, our portal for online reporting and account administration.

Access Payline: https://uat.windcave.com/pxmi3/logon

Username: OnStride_dev

Password: You should have received a user setup email. If not, please set your password using the link below with the above username and email address:  email| https://uat.windcave.com/pxmi3/forgotpassword





API Details

Refer to the REST API Authentication Guide for constructing the API Authorization header using the credentials below:

REST API Username: OnStride_dev

REST API Key: Generate and retrieve your API key by logging into Payline. Please store it securely, as it will not be fully visible after you apply the new key. More on key handling and rolling can be found here>

POST Endpoint: https://uat.windcave.com/api/v1/sessions

Postman Collections:
https://www.postman.com/windcave-api/windcave/folder/hx6wvku/hosted-payment-page

Developer Guide:
https://www.windcave.com/developer-e-commerce-api-rest



Session Capture (HPP flow)

To obtain the hosted payment page URL for customer redirection, create a session as outlined here:
https://px5.docs.apiary.io/#reference/0/sessions/create-session

After creating a session, use the following response fields to redirect or embed in an iFrame:

"href": "https://uat.windcave.com/pxmi3/....",
"rel": "hpp",
"method": "REDIRECT"


Fail Proof Result Notification (FPRN)

As requested, I have enabled POST notification.
More details: FPRN Guide



3DSecure

For 3DS, include additional fields in your create session request. Full specifications:
3DSecure Fields



Query Session

Retrieve full transaction details using the query session request with sessionId:
Query Session Guide



Tokenization / Stored Card

Details: Stored Card Guide
You can use tokens for rebilling/subscriptions. If you’d like to manage subscriptions via Windcave API, let me know and I’ll share the subscription API details.



Test Cards

Non 3DSecure Test card details: Test card



3DSecure Test Card:

5588 8800 0007 7770
Secure Code: 123
(Use any current expiry date.)
Google Pay and Apple Pay

Can be used with your live wallet for testing. Your card won't be charged as this is test account.



Paypal test credentials

Email: sb-jqzqa11931160@personal.example.com

Password: 7h;$2Q&M



If the integration method is not the one you are looking for please let me know the requirements and I can share documentation and details over.

We also have client-side library solutions like -  drop-in and hosted fields solutions, Pay by link solutions, etc



Please reply to all if you need assistance or have any technical queries.



Kind regards,


Bibek KC

www.windcave.com

WARNING - This email and any attachments may be confidential. If received in error, please delete and inform us by return email. Because emails and attachments may be interfered with, may contain computer viruses or other defects and may not be successfully replicated on other systems, you must be cautious. Windcave cannot guarantee that what you receive is what we sent. If you have any doubts about the authenticity of an email by Windcave, please contact us immediately.  It is also important to check for viruses and defects before opening or using attachments.  Windcave liability is limited to re-supplying any affected attachments. In addition, no employee or agent of Windcave is authorized to conclude an agreement or to agree upon binding contractual terms such as price via an email message, and any representations that violate such policy will be considered null and void.


On Wednesday, 24 December 2025, 8:05:15 am +1300, Gal Landsberg <gal@onstrideapp.com> wrote:
Quick edit. We meant to select PCI SAW Type A instead of Type A-EP. 

On Tue, Dec 23, 2025 at 13:52 < notifications@zohoforms.com> wrote:
Hi Gal,

Thank you for submitting your eCommerce payments integration requirements to Windcave. 
We'll use the information supplied to configure your API account and provide the required support.

Once configured you'll receive an email with the API access credentials. 

Regards,
Windcave

Business or Merchant Name	:	OnStride
Brief Business Description	:	All in one Digital Barn Management software.
Business or Merchant Website URL	:	www.onstrideapp.com
Merchant's System or Platform Name	:	
Merchant's System or Platform Version	:	
Brief Technical Architecture Details	:	
Technical Stack or Framework Details	:	Flutter frontend
Firebase backend
Industry Served	:	Other Services
Region Availability for the Business	:	Australia,Canada,Europe,Hong Kong,Malaysia,New Zealand,Singapore,United Kingdom,United States of America
Merchant Bank or Acquirer Name(s) used on go live	:	Windcave Acquiring
Estimated Go Live Date	:	01-Jan-2026
Contact Name (Primary)	:	Gal, Landsberg
Primary Contact Role or Position	:	CEO
Contact Phone (Primary)	:	9733377202
Contact Email (Primary)	:	gal@onstrideapp.com
Contact Name (Secondary)	:	
Secondary Contact Role or Position	:	
Contact Phone (Secondary)	:	
Contact Email (Secondary)	:	
Windcave Account Manager name	:	
Any existing integrations with us?	:	No
eCommerce Platform or Integration supports	:	Multiple merchant accounts
PCI SAQ (Self-Assessment Questionnaire) Type - Card Capture Method	:	PCI SAQ Type A-EP (Merchant Hosted Payment Page - Custom card capture form on client side)
Transaction Type - please indicate the types of transactions relevant for your business use cases.	:	Not Sure
Save the card as a token for future rebilling?	:	Yes
Payment use case if storing card as a token?	:	One off cardholder initiated - cardholder can select to pay with their saved card,One off merchant initiated and event driven - e.g. payment occurs on conditional account top ups,Recurring - e.g. Scheduled subscriptions
If your system requires, how should it receive the server side transaction notification?	:	HTTP POST
Payment methods your business is interested in supporting:	:	Account2Account,ApplePay,Card (Visa, Mastercard, Amex,etc),Google Pay,PayPal
Specify any other Payment Methods not listed:	:	
Optional Features	:	Store Customer Data independently,Capture & Show Customer Billing Information via our HPP,Save Card based on Customer Data,Risk Management,3D Secure,Address Verification Service (AVS),Email Payment Receipt for Merchant,Email Payment Receipt for Cardholder,Static IP Restriction for API access

-----


Gal Landsberg
Tue, Dec 23, 1:53 PM (5 days ago)
to me

Please see the API docs below provided by Windcave.

Terminals:

 Unattended Devices: https://www.windcave.com/unattended-payments
Attended Devices: https://www.windcave.com/instore-payments

Cloud Based API (HIT) – In Person Payments:

https://www.windcave.com/merchant-attended-developer-hit

XML Based API (Tupelo) – In Person Payments (Windows Only)

https://www.windcave.com/merchant-attended-developer-tupelo

 

 ECOM:

 Rest API Page for ECOM – https://www.windcave.com/developer-e-commerce-api-rest#Overview

FULL API Apairy (Reference Guide) - https://px5.docs.apiary.io/#introduction

Hosted Payment Page (HPP) API Page – https://www.windcave.com/developer-e-commerce-api-rest#HPP

Hosted Fields API Page – https://www.windcave.com/developer-ecommerce-hosted-fields

Drop In API Page - https://www.windcave.com/developer-ecommerce-drop-in

Drop In Demo URL - windcavedropintest.azurewebsites.net/ (You will see Applepay/Googlepay load into the drop in etc)

Tap to Pay on Iphone SDK/API - https://www.windcave.com/developer-attended-tap-to-pay-on-iPhone



Will receive official API docs in the next few days. 