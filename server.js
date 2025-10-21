import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// health-check, чтобы быстро понять что сервис жив
app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.get("/", (req, res) => res.send("Stripe backend is running 🚀"));

app.post("/checkout", async (req, res) => {
  try {
	const { amount, currency } = req.body || {};
	if (!Number.isInteger(amount) || amount <= 0 || !currency) {
	  return res.status(400).json({ error: "amount & currency required" });
	}

	const customer = await stripe.customers.create();
	const ephemeralKey = await stripe.ephemeralKeys.create(
	  { customer: customer.id },
	  { apiVersion: "2024-06-20" }
	);

	const paymentIntent = await stripe.paymentIntents.create({
	  amount,
	  currency: currency.toLowerCase(),
	  customer: customer.id,
	  automatic_payment_methods: { enabled: true },
	  // (опционально) metadata для матчинга:
	  // metadata: { listingId: req.body.listingId ?? "" }
	});

	res.json({
	  paymentIntent: paymentIntent.client_secret,
	  ephemeralKey: ephemeralKey.secret,
	  customer: customer.id,
	  publishableKey: process.env.PUBLISHABLE_KEY,
	});
  } catch (err) {
	console.error(err);
	res.status(400).json({ error: err.message });
  }
});


const PORT = parseInt(process.env.PORT, 10) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
});