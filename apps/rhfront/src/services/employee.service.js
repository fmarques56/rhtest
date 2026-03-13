import axios from "axios";

const BASE_URL = import.meta.env.VITE_CODESPACES_WORKSPACE_URL
	? import.meta.env.VITE_CODESPACES_WORKSPACE_URL
	: "http://localhost:8080";

async function create(employee) {
	const { data } = await axios.post(
		`${BASE_URL}/api/ajouter`,
		employee
	);
	return data;
}

async function fetch() {
	const { data } = await axios.get(`${BASE_URL}/api/employees`);
	return data;
}


async function searchDetailed(criteria) {
	const { data } = await axios.post(`${BASE_URL}/api/rechercher`, { mode: "detailed", search: criteria });
	return [...data];
}

async function update(employee) {
	const { data } = await axios.put(
		`${BASE_URL}/api/modifier/${employee.id}`,
		{
			name: employee.name,
			lastname: employee.lastname,
			salary: employee.salary,
			level: employee.level
		}
	);
	return data;
}

async function deleteOne(employee) {
	const { data } = await axios.delete(`${BASE_URL}/api/supprimer?id=${employee.id}`);
	return data;
}

async function deleteAll(apiToken) {
	await axios.delete(`${BASE_URL}/api/deleteall`, {
		headers: {
			Authorization: `${apiToken}`,
		},
	});
}

async function resetData(apiToken) {
	const { data } = await axios.post(`${BASE_URL}/api/datatest`, null, {
		headers: {
			Authorization: `${apiToken}`,
		},
	});
	return data;
}

const emptyEmployee = {
	id: "",
	name: "",
	lastname: "",
	salary: "",
	level: "",
};

	async function searchFullText(text) {
		const { data } = await axios.post(`${BASE_URL}/api/rechercher`, { mode: "fulltext", search: text });
		return [...data];
	}

export {
	create, deleteAll,
	deleteOne, emptyEmployee, fetch, resetData, searchDetailed, searchFullText, update
};

