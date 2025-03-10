import type { Request, Response, Router } from "express";
import router from "express-promise-router";
import { Counter } from "prom-client";

import { EmployeeService } from "./employee.service";

const ADMIN_API_TOKEN = "monTokenSecret123"; // Token d'authentification statique

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
	}

	/**
	 * Middleware pour vérifier l'authentification de l'admin
	 */
	private verifyAdminToken(req: Request, res: Response, next: Function) {
		const token = req.headers.authorization;
		
		if (!token) {
			return res.status(401).json({ error: "Token manquant" });
		}

		if (token !== ADMIN_API_TOKEN) {
			return res.status(403).json({ error: "Accès interdit, token invalide" });
		}

		next();
	}

	/**
	 * Définition des routes API
	 */
	routes(): Router {
		this.#router.get("/api/rechercher", async (req: Request, res: Response) => {
			if (req.query.mode === "all") {
				this.#searchCounter.inc({ type: "GET", route: "/api/rechercher?mode=all", response: 200, ip: req.socket.remoteAddress });
				const employees = await this.#employeeService.list();
				return res.json(employees);
			}

			if (req.query.name) {
				this.#searchCounter.inc({ type: "GET", route: "/api/rechercher?name=$name", response: 200, ip: req.socket.remoteAddress });
				const employees = await this.#employeeService.getByName(req.query.name as string);
				return res.json(employees);
			}

			this.#searchCounter.inc({ type: "GET", route: "/api/rechercher", response: 400, ip: req.socket.remoteAddress });
			res.sendStatus(400);
		});

		this.#router.post("/api/ajouter", async (req: Request, res: Response) => {
			try {
				await this.#employeeService.add(
					req.query.id as string,
					req.query.name as string,
					req.query.lastname as string,
					req.query.salary as string,
					req.query.level as string,
				);
				this.#searchCounter.inc({ type: "POST", route: "/api/ajouter", response: 201, ip: req.socket.remoteAddress });
				res.status(201).send("Le salarié a bien été ajouté");
			} catch (error) {
				console.log((error as Error).message);
				let response = (error as Error).message === 'Le matricule existe déjà' ? 409 : 400;
				this.#searchCounter.inc({ type: "POST", route: "/api/ajouter", response, ip: req.socket.remoteAddress });
				return res.status(response).send((error as Error).message);
			}
		});

		this.#router.post("/api/modifier/:id", async (req: Request, res: Response) => {
			try {
				await this.#employeeService.update(
					req.params.id as string,
					req.query.name as string,
					req.query.lastname as string,
					req.query.salary as string,
					req.query.level as string,
				);
				this.#searchCounter.inc({ type: "POST", route: "/api/modifier", response: 200, ip: req.socket.remoteAddress });
				res.status(200).send("Le salarié a bien été modifié");
			} catch (error) {
				console.log((error as Error).message);
				let response = 400;
				if ((error as Error).message === 'Le matricule existe déjà') response = 409;
				if ((error as Error).message === `Le matricule n'a pas été trouvé`) response = 404;
				this.#searchCounter.inc({ type: "POST", route: "/api/modifier", response, ip: req.socket.remoteAddress });
				return res.status(response).send((error as Error).message);
			}
		});

		this.#router.delete("/api/supprimer", async (req: Request, res: Response) => {
			try {
				await this.#employeeService.delete(req.query.id as string);
				this.#searchCounter.inc({ type: "POST", route: "/api/supprimer", response: 200, ip: req.socket.remoteAddress });
				res.status(200).send("Le salarié a bien été supprimé");
			} catch (error) {
				console.log((error as Error).message);
				this.#searchCounter.inc({ type: "POST", route: "/api/supprimer", response: 400, ip: req.socket.remoteAddress });
				return res.status(400).send((error as Error).message);
			}
		});

		/**
		 * Route protégée: Suppression de toutes les données
		 */
		this.#router.delete("/api/deleteall", this.verifyAdminToken, async (req: Request, res: Response) => {
			await this.#employeeService.deleteAll();
			res.sendStatus(200);
		});

		/**
		 * Route protégée: Réinitialisation des données de test
		 */
		this.#router.post("/api/datatest", this.verifyAdminToken, async (req: Request, res: Response) => {
			await this.#employeeService.reset();
			res.status(201).send("Le fichier de salarié a été réinitialisé");
		});

		return this.#router;
	}
}

export { EmployeeController };
