<template>
    <div v-if="isVisible" class="modal-overlay">
      <div class="modal">
        <p>{{ message }}</p>
        <div class="modal-actions">
          <button @click="confirmAction" class="confirm-btn">Confirmer</button>
          <button @click="cancelAction" class="cancel-btn">Annuler</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      isVisible: Boolean,
      message: String
    },
    emits: ['confirm', 'cancel'],
    methods: {
      confirmAction() {
        this.$emit('confirm');
      },
      cancelAction() {
        this.$emit('cancel');
      }
    }
  };
  </script>
  
  <style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }
  
  .modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .confirm-btn {
    background-color: #d9534f;
    color: white;
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .cancel-btn {
    background-color: #5bc0de;
    color: white;
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  </style>
  