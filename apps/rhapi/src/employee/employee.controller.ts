import type { Request, Response, Router } from "express";
import router from "express-promise-router";
import { Counter } from "prom-client";

import { EmployeeService } from "./employee.service";

const ADMIN_API_TOKEN = "monTokenSecret123"; // Token d'authentification statique

// Helper pour obtenir l'IP réelle du client
function getClientIp(req: Request): string {
	// req.ip prend en compte trust proxy si activé dans Express
	return req.ip || req.socket.remoteAddress || "unknown";
}

class EmployeeController {
	#router: Router;
	#employeeService: EmployeeService;
	#searchCounter: Counter;

	constructor(employeeService: EmployeeService) {
		this.#router = router();
		this.#employeeService = employeeService;
		this.#searchCounter = new Counter({
			name: "search_counter",
			help: "metric_help",
			labelNames: ["type", "route", "response", "ip"],
		});
		// Bind du middleware pour garder le bon this
		this.verifyAdminToken = this.verifyAdminToken.bind(this);
	}

	/**
	 * Middleware pour vérifier l'authentification de l'admin
	 */
	private verifyAdminToken(req: Request, res: Response, next: Function) {
		const token = req.headers.authorization;
		
		if (!token) {
			this.#searchCounter.inc({ type: req.method, route: req.route?.path, response: 401, ip: getClientIp(req) });
			return res.status(401).json({ error: "Token manquant" });
		}

		if (token !== ADMIN_API_TOKEN) {
			this.#searchCounter.inc({ type: req.method, route: req.route?.path, response: 403, ip: getClientIp(req) });
			return res.status(403).json({ error: "Accès interdit, token invalide" });
		}

		next();
	}

	/**
	 * Définition des routes API
	 */
	routes(): Router {
		/**
		 * Route GET /api/employees pour récupérer tous les employés
		 */
		this.#router.get("/api/employees", async (req: Request, res: Response) => {
			const employees = await this.#employeeService.list();
			this.#searchCounter.inc({ type: "GET", route: "/api/employees", response: 200, ip: getClientIp(req) });
			return res.json(employees);
		});

		this.#router.post("/api/ajouter", async (req: Request, res: Response) => {
			try {
				const { id, name, lastname, salary, level } = req.body;
				await this.#employeeService.add(
					id,
					name,
					lastname,
					salary,
					level
				);
				this.#searchCounter.inc({ type: "POST", route: "/api/ajouter", response: 201, ip: getClientIp(req) });
				res.status(201).send("L'employé a été ajouté avec succès");
			} catch (error) {
				console.log((error as Error).message);
				let response = (error as Error).message === 'Le matricule existe déjà' ? 409 : 400;
				this.#searchCounter.inc({ type: "POST", route: "/api/ajouter", response, ip: getClientIp(req) });
				return res.status(response).send((error as Error).message);
			}
		});

		/**
		 * Route GET /api/employee/:id
		 */
		this.#router.get("/api/employee/:id", async (req: Request, res: Response) => {
			try {
				const employee = await this.#employeeService.getById(req.params.id as string);
				this.#searchCounter.inc({ type: "GET", route: "/api/employee/:id", response: 200, ip: getClientIp(req) });
				return res.json(employee);
			} catch (error) {
				this.#searchCounter.inc({ type: "GET", route: "/api/employee/:id", response: 404, ip: getClientIp(req) });
				return res.status(404).send((error as Error).message);
			}
		});

		/**
		 * Route POST /api/rechercher (body: { search })
		 */
		this.#router.post("/api/rechercher", async (req: Request, res: Response) => {
			try {
				const employees = await this.#employeeService.searchFlexible(req.body);
				this.#searchCounter.inc({ type: "POST", route: "/api/rechercher", response: 200, ip: getClientIp(req) });
				return res.json(employees);
			} catch (error) {
				this.#searchCounter.inc({ type: "POST", route: "/api/rechercher", response: 400, ip: getClientIp(req) });
				return res.status(400).send((error as Error).message);
			}
		});

		/**
		 * Route PUT /api/modifier/:id (body: { name, lastname, salary, level })
		 */
		this.#router.put("/api/modifier/:id", async (req: Request, res: Response) => {
			try {
				const { name, lastname, salary, level } = req.body;
				await this.#employeeService.update(
					req.params.id as string,
					name,
					lastname,
					salary,
					level
				);
				this.#searchCounter.inc({ type: "PUT", route: "/api/modifier", response: 200, ip: getClientIp(req) });
				res.status(200).send("L'employé a été modifié avec succès");
			} catch (error) {
				console.log((error as Error).message);
				let response = 400;
				if ((error as Error).message === 'Le matricule existe déjà') response = 409;
				if ((error as Error).message === `Le matricule n'a pas été trouvé`) response = 404;
				this.#searchCounter.inc({ type: "PUT", route: "/api/modifier", response, ip: getClientIp(req) });
				return res.status(response).send((error as Error).message);
			}
		});

		this.#router.delete("/api/supprimer", async (req: Request, res: Response) => {
			try {
				await this.#employeeService.delete(req.query.id as string);
				this.#searchCounter.inc({ type: "DELETE", route: "/api/supprimer", response: 200, ip: getClientIp(req) });
				res.status(200).send("L'employé a été supprimé avec succès");
			} catch (error) {
				console.log((error as Error).message);
				this.#searchCounter.inc({ type: "DELETE", route: "/api/supprimer", response: 400, ip: getClientIp(req) });
				return res.status(400).send((error as Error).message);
			}
		});

		/**
		 * Route protégée: Suppression de toutes les données
		 */
		this.#router.delete("/api/deleteall", this.verifyAdminToken, async (req: Request, res: Response) => {
			await this.#employeeService.deleteAll();
			this.#searchCounter.inc({ type: "DELETE", route: "/api/deleteall", response: 200, ip: getClientIp(req) });
			res.sendStatus(200);
		});

		/**
		 * Route protégée: Réinitialisation des données de test
		 */
		this.#router.post("/api/datatest", this.verifyAdminToken, async (req: Request, res: Response) => {
			await this.#employeeService.reset();
			this.#searchCounter.inc({ type: "POST", route: "/api/datatest", response: 201, ip: getClientIp(req) });
			res.status(201).send("Le fichier de salarié a été réinitialisé");
		});

		return this.#router;
	}
}

export { EmployeeController };
