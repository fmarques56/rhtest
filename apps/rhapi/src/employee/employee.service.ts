import assert from "node:assert";
import { EmployeeRepository } from "./employee.repository";

class EmployeeService {
	async searchFlexible(body: { mode: "fulltext" | "detailed", search: string | Record<string, string> }) {
		const employees = await this.list();
		if (!body.mode || !["fulltext", "detailed"].includes(body.mode)) {
			throw new Error("Le mode de recherche doit être 'fulltext' ou 'detailed'.");
		}
		if (body.mode === "fulltext" && typeof body.search === "string") {
			const lowerSearch = body.search.toLowerCase();
			return employees.filter(emp => {
				return Object.values(emp).some(val =>
					typeof val === "string" && val.toLowerCase().includes(lowerSearch)
				);
			});
		}
		if (body.mode === "detailed" && typeof body.search === "object" && body.search !== null) {
			return employees.filter(emp => {
				const e = emp as Record<string, any>;
				return Object.entries(body.search).every(([key, value]) => {
					if (!value || !e[key]) return true;
					// Insensible à la casse pour les strings
					if (["id", "name", "lastname", "level"].includes(key)) {
						return typeof e[key] === "string" && e[key].toLowerCase().includes(value.toLowerCase());
					}
					// Exact pour salary
					if (key === "salary") {
						return e[key] === value;
					}
					return true;
				});
			});
		}
		throw new Error("Le mode de recherche et le type de données ne correspondent pas.");
	}
	#employeeRepository: EmployeeRepository;

	constructor(employeeRepository: EmployeeRepository) {
		this.#employeeRepository = employeeRepository;
	}

	async list() {
		const employees = await this.#employeeRepository.list();
		return employees.sort(function (b, a) {
			return a.time - b.time;
		});
	}


	async getById(id: string) {
		if (!id || !id.length) {
			throw new Error("Le matricule est obligatoire");
		}
		const employees = await this.list();
		const found = employees.find((salarie) => salarie.id === id);
		if (!found) {
			throw new Error(`L'employé ${id} n'a pas été trouvé`);
		}
		return found;
	}

	async #validateEmployeePayload(
		id: string,
		name: string,
		lastname: string,
		salary: string,
		level: string,
		kind: "create" | "update",
	) {
		const numSalary = parseFloat(salary);
		assert(
			salary && numSalary > 0 && !isNaN(numSalary),
			"Le salaire doit être un nombre positif",
		);

		const numLevel = Math.abs(parseInt(level));
		assert(
			numLevel && numLevel < 10 && !isNaN(numLevel),
			"Le niveau doit être > -10 et < 10",
		);

		// rules required
		assert(name.length > 0, "Le nom est obligatoire");
		assert(lastname.length > 0, "Le prénom est obligatoire");
		assert(id.length > 0, "Le matricule est obligatoire");

		const employees = await this.list();

		if (kind === "create") {
			const found = employees.findIndex((salarie) => salarie.id === id);
			assert(found === -1, "Le matricule existe déjà");
		}

		if (kind === "update") {
			const found = employees.findIndex((salarie) => salarie.id === id);
			assert(found !== -1, "Le matricule n'a pas été trouvé");
		}
	}

	async add(
		id: string,
		name: string,
		lastname: string,
		salary: string,
		level: string,
	) {
		await this.#validateEmployeePayload(
			id,
			name,
			lastname,
			salary,
			level,
			"create",
		);

		this.#employeeRepository.add({
			id,
			name,
			lastname,
			salary,
			level,
			time: new Date().getTime(),
		});
	}

	async update(
		id: string,
		name: string,
		lastname: string,
		salary: string,
		level: string,
	) {
		await this.#validateEmployeePayload(
			id,
			name,
			lastname,
			salary,
			level,
			"update",
		);

		this.#employeeRepository.update({
			id,
			name,
			lastname,
			salary,
			level,
			time: new Date().getTime(),
		});
	}

	async delete(id: string) {
		assert(id, "L'employé n'a pas été trouvé");
		const employees = await this.list();
		const found = employees.findIndex((salarie) => salarie.id === id);
		assert(found !== -1, "L'employé n'a pas été trouvé");
		this.#employeeRepository.delete(found);
	}

	async deleteAll() {
		this.#employeeRepository.deleteAll();
	}

	async reset() {
		this.#employeeRepository.reset();
	}
}

export { EmployeeService };
