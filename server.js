import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


app.post("/checkout", async (req, res) => {
  try {

	const customer = await stripe.customers.create();

	
	const ephemeralKey = await stripe.ephemeralKeys.create(
	  { customer: customer.id },
	  { apiVersion: "2024-06-20" } 
	);

	
	const paymentIntent = await stripe.paymentIntents.create({
	  amount: 6500, // $65.00
	  currency: "usd",
	  customer: customer.id,
	  automatic_payment_methods: { enabled: true },
	});

	
	res.json({
	  paymentIntent: paymentIntent.client_secret,
	  ephemeralKey: ephemeralKey.secret,
	  customer: customer.id,
	  publishableKey: process.env.PUBLISHABLE_KEY
	});

  } catch (err) {
	console.error(err);
	res.status(400).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("Stripe backend is running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));