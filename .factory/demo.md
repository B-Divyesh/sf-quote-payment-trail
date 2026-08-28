# Deal Thread demo sandbox

Open [`/demo`](https://quote-payment-trail.sociobot.in/demo), or select **Try it with sample data** on the landing page. The demo immediately opens the Riverside shopfit casefile with a quote, partial delivery, invoice, payment, and an intentionally unlinked credit.

The demo uses the isolated IndexedDB database `demo:deal-thread-v1`. It never reads or writes the real database `deal-thread-v1`. The persistent banner offers **Reset demo**, which replaces only the demo database contents, and **Start for real**, which returns to the real workspace. Use the direct `/demo` URL for all repeatable checks.
