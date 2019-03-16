exports.items = {
  small_health_potion : {
    cost : 3,
    description : "Heals a bit",
    use : (who, enemy, message) => {
      who.hp += 5
    }
  },

  health_potion : {
    cost : 6,
    description : "Heals",
    use : (who, enemy, message) => {
      who.hp += 10
    }
  },

  big_health_potion : {
    cost : 10,
    description : "Heals a lot",
    use : (who, enemy, message) => {
      who.hp += 20
    }
  }
}