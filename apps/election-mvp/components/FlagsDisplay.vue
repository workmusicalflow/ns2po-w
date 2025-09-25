<template>
  <div class="flags-contextual">
    <!-- <span class="flags-contextual-label">Présents en :</span>-->
    <div class="flags-list">
      <img
        v-for="flag in flags"
        :key="flag.code"
        :src="flag.url"
        :alt="`Drapeau ${flag.name}`"
        :title="flag.name"
        class="flag-icon"
        loading="lazy"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
interface Flag {
  name: string
  code: string
  url: string
}

// Configuration des drapeaux avec URLs Cloudinary optimisées
const flags: Flag[] = [
  {
    name: "Côte d'Ivoire",
    code: 'ci',
    url: 'https://flagcdn.com/w80/ci.png'
  },
  {
    name: 'Mali',
    code: 'ml',
    url: 'https://flagcdn.com/w80/ml.png'
  },
  {
    name: 'Burkina Faso',
    code: 'bf',
    url: 'https://flagcdn.com/w80/bf.png'
  },
  {
    name: 'Gabon',
    code: 'ga',
    url: 'https://flagcdn.com/w80/ga.png'
  },
  {
    name: 'Guinée',
    code: 'gn',
    url: 'https://flagcdn.com/w80/gn.png'
  },
  {
    name: 'Liberia',
    code: 'lr',
    url: 'https://flagcdn.com/w80/lr.png'
  }
]
</script>

<style scoped>
.flags-contextual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  animation: fadeInScale 1.5s ease-out forwards;
  animation-delay: 1.8s;
  opacity: 0;
}

.flags-contextual-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-weight: 400;
  white-space: nowrap;
  font-family: var(--font-body);
}

.flags-list {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.flag-icon {
  width: 45px;
  height: 30px; /* Ratio standard des drapeaux 3:2 */
  object-fit: cover; /* Assure que l'image remplit l'espace sans déformation */
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: block; /* Évite les espaces en dessous */
}

.flag-icon:hover {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
}

/* Animation d'entrée */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .flags-contextual {
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .flags-contextual-label {
    font-size: 1rem;
  }

  .flags-list {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .flag-icon {
    width: 35px;
    height: 23px; /* Maintient le ratio 3:2 */
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .flags-contextual-label {
    font-size: 0.9rem;
  }

  .flag-icon {
    width: 30px;
    height: 20px; /* Maintient le ratio 3:2 */
  }

  .flags-list {
    gap: 0.4rem;
  }
}
</style>