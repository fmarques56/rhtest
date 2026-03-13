import cors from "cors";
import express, { Express } from "express";
import prometheusClient from "prom-client";

import { EmployeeModule } from "./employee/employee.module";
import swagger from "./resources/swagger.json";


class Server {
	#app: Express;
	#metricsEnabled: boolean = true;

	constructor() {
		this.#app = express();

		prometheusClient.collectDefaultMetrics({
			labels: { service: "rhapi" },
		});
	}

	bootstrap() {
		this.#app.use(cors());
		this.#app.use(express.json());
		this.#app.use(
			express.urlencoded({
				extended: false,
			}),
		);
		// Pour que req.ip reflète l'IP réelle du client derrière un proxy
		this.#app.set("trust proxy", true);

		new EmployeeModule(this.#app);

		this.#app.use("/", express.static(`${__dirname}/public`));

		this.#app.get("/swagger.json", (req, res) => {
			res.json(swagger);
		});

		// Route pour activer/désactiver l'exposition de /metrics
		this.#app.get("/metric", (req, res) => {
			const enable = req.query.enable;
			if (enable === "true") {
				this.#metricsEnabled = true;
				return res.json({ metricsEnabled: true });
			} else if (enable === "false") {
				this.#metricsEnabled = false;
				return res.json({ metricsEnabled: false });
			}
			return res.status(400).json({ error: "Paramètre 'enable' requis (true/false)" });
		});

		this.#app.get("/metrics", async (req, res) => {
			if (!this.#metricsEnabled) {
				return res.status(403).json({ error: "Metrics endpoint is disabled" });
			}
			res.writeHead(200, {
				"Content-Type": prometheusClient.register.contentType,
			});
			return res.end(await prometheusClient.register.metrics());
		});

		return this.#app;
	}

	run() {
		this.#app.listen(8080, () => {
			console.log("🚀 server started and available on http://localhost:8080");
		});
	}
}

export { Server };
