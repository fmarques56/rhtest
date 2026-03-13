<template>
  <header class="container">
    <h1><img id="logo" src="/logo.png" alt="application logo"> RhTest</h1>
  </header>
  <main class="container">
    <div class="error" id="errorMessage" v-if="errorMessage">
      <span>Une erreur est survenue : {{ errorMessage }}</span>
      <button class="close-btn" @click="closeMessages" id="closeErrorMessage">✖</button>
    </div>

    <div class="success" id="successMessage" v-if="successMessage">
      <span>{{ successMessage }}</span>
      <button class="close-btn" @click="closeMessages" id="closeSuccessMessage">✖</button>
    </div>

    <section id="employeeCreation">
      <h2>Création d'un salarié :</h2>
      <Employee @created="createdEvent" />
    </section>

    <section id="employeeList">
      <h2>Liste des salariés (<span id="employeesLength">{{ employees.length || 0 }}</span>) :</h2>
      <form>
        <div class="grid">
          <input v-model="searchTerm" type="search" id="search" name="search" placeholder="Recherche rapide" @keyup="searchFullText(searchTerm)" @input="onSearchInput">          
        </div>
        <div class="search">
          <button type="button" class="small-btn" @click="showDetailedSearch = true" id="detailedSearch">🔍 Recherche détaillée</button>
          <button type="button" class="small-btn outline" @click="resetSearch" id="resetSearch">🧹 Annuler la recherche</button>
        </div>
      </form>
      <div v-if="showDetailedSearch" class="modal-overlay">
        <div class="modal">
          <button class="close-btn modal-close" @click="showDetailedSearch = false" id="closeDetailedSearch">✖</button>
          <h3>Recherche détaillée</h3>
          <form @submit.prevent="searchDetailedSubmit">
            <label>Matricule: <input v-model="detailed.id" placeholder="ID" id="detailedId"></label>
            <div class="grid">
              <label>Nom: <input v-model="detailed.name" placeholder="Nom" id="detailedName"></label>
              <label>Prénom: <input v-model="detailed.lastname" placeholder="Prénom" id="detailedLastname"></label>
            </div>
            <div class="grid">
              <label>Salaire: <input v-model="detailed.salary" placeholder="Salaire" id="detailedSalary"></label>
              <label>Niveau: <input v-model="detailed.level" placeholder="Niveau" id="detailedLevel"></label>
            </div>
            <div class="admin">
              <button type="submit" class="small-btn" id="confirmDetailedSearch">🔍 Rechercher</button>
            </div>
          </form>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Salaire</th>
            <th>Niveau</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee, index in employees" :key="employee.id">
            <td :id="'empId_' + index">{{ employee.id }}</td>
            <td :id="'empName_' + index">{{ employee.name }}</td>
            <td :id="'empLasttname_' + index">{{ employee.lastname }}</td>
            <td :id="'empSalary_' + index">{{ employee.salary }}</td>
            <td :id="'empLevel_' + index">{{ employee.level }}</td>
            <td>
              <button class="outline small-btn" @click="toggleUpdate(employee)" :id="'empUpdate_' + index">📝</button>
              <button class="outline small-btn" @click="openDeleteConfirm(employee)" :id="'empDelete_' + index">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="employeeUpdate" v-if="updateMode">
      <Employee v-if="updateMode" :id="employee.id" :name="employee.name" :lastname="employee.lastname"
          :salary="employee.salary" :level="employee.level" @updated="updateEmployee" @close="updateMode = false" />
    </section>

    <section id="admin">
      <h2>Administration</h2>
      <div class="admin">
        <button class="small-btn" @click="openAdminModal('deleteAll')" id="deleteAll">🗑️ Supprimer les données</button>
        <button class="small-btn outline" @click="openAdminModal('resetData')" id="resetData">↩ Restaurer les données de test</button>
      </div>
    </section>

    <!-- Boîte de dialogue de confirmation -->
    <ConfirmDialog
      :isVisible="showConfirmDialog"
      :message="confirmMessage"
      @confirm="confirmDelete"
      @cancel="showConfirmDialog = false"
    />

    <!-- Modale d'administration -->
    <div v-if="showAdminModal" class="modal-overlay">
      <div class="modal">
        <h3>Action d'administration</h3>
        <p>{{ adminActionMessage }}</p>
        <input v-model="adminToken" type="password" placeholder="Token d'administration" id="adminToken">
        <div class="modal-actions">
          <button class="small-btn" @click="confirmAdminAction" id="confirmAdminAction">✓ Confirmer</button>
          <button class="small-btn outline" @click="closeAdminModal" id="closeAdminModal">✖️ Annuler</button>
        </div>
      </div>
    </div>
  </main>
</template> 

<script>
import ConfirmDialog from './components/ConfirmDialog.vue';
import Employee from './components/Employee.vue';
import { create, deleteAll, deleteOne, emptyEmployee, fetch, resetData, searchDetailed, searchFullText, update } from './services/employee.service';

export default {
  data() {
    return {
      employee: emptyEmployee,
      employees: [],
      searchTerm: "",
      showDetailedSearch: false,
      detailed: { id: "", name: "", lastname: "", salary: "", level: "" },
      updateMode: false,
      error: null,
      showConfirmDialog: false,
      confirmMessage: '',
      confirmCallback: null,
      errorMessage: null,
      successMessage: null,
      showAdminModal: false,
      adminToken: "",
      adminAction: null,
      adminActionMessage: "",
    };
  },
  components: { Employee, ConfirmDialog },
  mounted() {
    this.fetchEmployees();
  },
  methods: {
            resetSearch() {
              this.searchTerm = "";
              this.detailed = { id: "", name: "", lastname: "", salary: "", level: "" };
              this.fetchEmployees();
            },
            onSearchInput(e) {
              if (!e.target.value) {
                this.resetSearch();
              }
            },
        async searchFullText(text) {
          if (!text.length) {
            return this.fetchEmployees();
          }
          this.employees = await searchFullText(text);
        },
    async fetchEmployees() {
      this.employees = await fetch();
    },
    async searchDetailedSubmit() {
      // Reset la recherche fulltext
      this.searchTerm = "";
      // Filtre les champs vides
      const filtered = Object.fromEntries(Object.entries(this.detailed).filter(([_, v]) => v && v.length));
      // Appelle directement searchDetailed(filtered) qui construit le bon body
      this.employees = await searchDetailed(filtered);
      this.showDetailedSearch = false;
    },
    async createdEvent(employee) {
      try {
        this.successMessage = await create(employee);
      } catch (error) {
        this.errorMessage = error.response.data;
      } finally {
        this.employee = emptyEmployee;
        return this.fetchEmployees();
      }
    },
    toggleUpdate(employee) {
      this.updateMode = !this.updateMode;
      this.employee = this.updateMode ? employee : emptyEmployee;
    },
    async updateEmployee(employee) {
      try {
        this.successMessage = await update(employee);
      } catch (error) {
        this.errorMessage = error.response.data;
      } finally {
        this.employee = emptyEmployee;
        this.updateMode = false;
        return this.fetchEmployees();
      }
    },
    openDeleteConfirm(employee) {
      this.confirmMessage = `Voulez-vous vraiment supprimer ${employee.name} ${employee.lastname} ?`;
      this.confirmCallback = () => this.deleteEmployee(employee);
      this.showConfirmDialog = true;
    },
    async deleteEmployee(employee) {
      try {
        this.successMessage = await deleteOne(employee);
      } catch (error) {
        this.errorMessage = error.response.data;
      } finally {
        this.fetchEmployees();
      }
    },
    async deleteAll() {
      await deleteAll();
      return this.fetchEmployees();
    },
    async resetData() {
      this.successMessage = await resetData();
      return this.fetchEmployees();
    },
    confirmDelete() {
      if (this.confirmCallback) this.confirmCallback();
      this.showConfirmDialog = false;
    },
    closeMessages() {
      this.errorMessage = null;
      this.successMessage = null;
    },
    openAdminModal(action) {
      this.adminAction = action;
      this.adminActionMessage =
        action === "deleteAll"
          ? "Entrez votre token pour supprimer toutes les données."
          : "Entrez votre token pour restaurer les données de test.";
      this.showAdminModal = true;
    },
    closeAdminModal() {
      this.showAdminModal = false;
      this.adminToken = "";
      this.adminAction = null;
    },
    async confirmAdminAction() {
      if (!this.adminToken) {
        this.errorMessage = "Le token est obligatoire.";
        return;
      }
      try {
        if (this.adminAction === "deleteAll") {
          await deleteAll(this.adminToken);
          this.successMessage = "Toutes les données ont été supprimées.";
        } else if (this.adminAction === "resetData") {
          await resetData(this.adminToken);
          this.successMessage = "Les données de test ont été restaurées.";
        }
      } catch (error) {
        this.errorMessage = (error.response?.data?.error || error.message);
      } finally {
        this.closeAdminModal();
        this.fetchEmployees();
      }
    },
  },
}
</script>

<style>
.close-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  color: inherit;
  float: right;
  margin-top: -0.3rem;
}

.small-btn {
  width: auto;
  display: inline;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0;
  font-size: 0.75em;
}

.admin>button {
  margin: 0.25rem;
}

.search>button {
  margin: 0.25rem;
}

.modal-actions>button {
  margin: 0.25rem;
}

.error {
  color: #D8000C;
  background-color: #FFBABA;
  border-radius: 10px;
  height: 4rem;
  line-height: 2rem;
  padding: 1rem; 
}

.success {
  color: #4F8A10;
  background-color: #DFF2BF;
  border-radius: 10px;
  height: 4rem;
  line-height: 2rem;
  padding: 1rem; 
}

#logo{
  width: 100px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #333;
  z-index: 2;
}

.modal {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

.modal input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}


.modal-actions {
  display: flex;
  justify-content: right;
}

.grid {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
}
</style>