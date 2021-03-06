var wrap = function() {
  var client = new GameNodeClient(Skeleton);
  var session = null;
  var theme = null;
  
  $(document).ready(function() {
    var loginUrl = "login.html?next=" + document.location.pathname + document.location.search;
    session = resumeSessionOrRedirect(client, WARS_CLIENT_SETTINGS.gameServer, loginUrl, function() {
      populateNavigation(session);
      client.stub.profile(function(response) {
        theme = new Theme(response.profile.settings.gameTheme);
        theme.load(function() {
          client.stub.gameRules(null, function(rules) {
            populateInfo(rules);
          });
        });
      });
    });
  });
  
  function populateInfo(rules) {
    populateArmorNames(rules);
    populateTerrainNames(rules);
    populateRangeNumbers(rules);
    
    populateUnits(rules);
    populateWeapons(rules);
    populateRanges(rules);
    populateDefenses(rules);
    populateMovement(rules);
  }

  function populateArmorNames(rules) {
    var numArmors = 0;
    forEachProperty(rules.armors, function(armor) {
      numArmors += 1;
      $(".armorNames").each(function() {
        var item = $("<th></th>");
        item.text(armor.name);
        $(this).append(item);
      }); 
    });
    $(".numArmors").attr("colspan", numArmors);
  }
  
  function populateTerrainNames(rules) {
    var numTerrains = 0;
    forEachProperty(rules.terrains, function(terrain) {
      numTerrains += 1;
      $(".terrainNames").each(function() {
        var item = $("<th></th>");
        item.text(terrain.name);
        $(this).append(item);
      });
      
      $(".terrainImages").each(function() {
        var item = $("<td></td>");
        var image = $("<span></span>");
        
        image.css("background-image", "url('" + theme.getSpriteSheetUrl() + "')");
        image.addClass("sprite");
        var pos = theme.getTileCoordinates(terrain.id, 0, 0);
        var imageX = pos.x * 48;
        var imageY = pos.y * 48;
        image.css("background-position", -imageX + "px " + -imageY + "px")
        item.append(image);
        $(this).append(item);
      });
      
    });
    $(".numTerrains").attr("colspan", numTerrains);
  }
  
  function maxRange(rules) {
    var result = 0;
    forEachProperty(rules.weapons, function(weapon) {
      forEachProperty(weapon.rangeMap, function(efficiency, range) {
        if(range > result)
          result = range;
      });
    });
    return result;
  }
  
  function populateRangeNumbers(rules) {
    var max = maxRange(rules);
    $(".rangeNumbers").each(function() {
      for(var j = 1; j <= max; ++j) {
        var item = $("<th></th>");
        item.text(j);
        $(this).append(item);
      }
    });
    $(".numRanges").attr("colspan", max);
  }
  
  function populateUnits(rules) {
    var units = $("#units tbody");
    forEachProperty(rules.units, function(unit) {
      var item = $("<tr></tr>");
      var image = $("<td></td>");
      var name = $("<td></td>");
      var className = $("<td></td>");
      var price = $("<td></td>");
      var armorName = $("<td></td>");
      var primaryWeaponName = $("<td></td>");
      var secondaryWeaponName = $("<td></td>");
      var movement = $("<td></td>");
      var movementTypeName = $("<td></td>");
      var carry = $("<td></td>");
      var flags = $("<td></td>");

      image.css("background-image", "url('" + theme.getSpriteSheetUrl() + "')");
      image.addClass("sprite");
      var pos = theme.getUnitCoordinates(unit.id, 1);
      var imageX = pos.x * 48;
      var imageY = pos.y * 48;
      image.css("background-position", -imageX + "px " + -imageY + "px")

      name.text(unit.name);
      name.addClass("name");
      className.text(rules.unitClasses[unit.unitClass].name);
      price.text(unit.price);
      armorName.text(rules.armors[unit.armor].name);
      primaryWeaponName.text(unit.primaryWeapon !== null ? rules.weapons[unit.primaryWeapon].name : "-");
      secondaryWeaponName.text(unit.secondaryWeapon !== null ? rules.weapons[unit.secondaryWeapon].name : "-");
      movement.text(unit.movement);
      movementTypeName.text(rules.movementTypes[unit.movementType].name);
      var carryClasses = unit.carryClasses.map(function(classId) {return rules.unitClasses[classId].name; }).join(", ");
      carry.text(unit.carryNum > 0 ? unit.carryNum + "x " + carryClasses : "-");
      flags.text(unit.flags.map(function(flagId) {return rules.unitFlags[flagId].name; }).join(", "));
      
      item.append(image);
      item.append(name);
      item.append(className);
      item.append(price);
      item.append(armorName);
      item.append(primaryWeaponName);
      item.append(secondaryWeaponName);
      item.append(movement);
      item.append(movementTypeName);
      item.append(carry);
      item.append(flags);
      
      units.append(item);
    });
  }
  
  function populateWeapons(rules) {
    var weapons = $("#weapons tbody");
    forEachProperty(rules.weapons, function(weapon) {
      var item = $("<tr></tr>");
      var name = $("<td></td>");
      
      name.text(weapon.name);
      item.append(name);
      
      forEachProperty(rules.armors, function(armor) {
        var power = weapon.powerMap[armor.id];
        var powerItem = $("<td></td>");
        powerItem.text(power ? power : "-");
        item.append(powerItem);
      });
      weapons.append(item);
    });
  }
  
  function populateRanges(rules) {
    var ranges = $("#ranges tbody");
    forEachProperty(rules.weapons, function(weapon) {
      var item = $("<tr></tr>");
      var name = $("<td></td>");
      var requireDeployed = $("<td></td>");
      
      name.text(weapon.name);
      requireDeployed.text(weapon.requireDeployed ? "x" : "");
      
      item.append(name);
      
      var max = maxRange(rules);
      for(var range = 1; range <= max; ++range) {
        var efficiency = weapon.rangeMap[range];
        var efficiencyItem = $("<td></td>");
        efficiencyItem.text(efficiency ? efficiency : "-");
        item.append(efficiencyItem);
      }
      
      item.append(requireDeployed);
      
      ranges.append(item);
    });
  }
  
  function populateDefenses(rules) {
    var defenses = $("#defenses tbody");
    forEachProperty(rules.units, function(unit) {
      var movementType = rules.movementTypes[unit.movementType];
      var item = $("<tr></tr>");
      var name = $("<td></td>");
      var image = $("<td></td>");
      
      image.css("background-image", "url('" + theme.getSpriteSheetUrl() + "')");
      image.addClass("sprite");
      var pos = theme.getUnitCoordinates(unit.id, 1);
      var imageX = pos.x * 48;
      var imageY = pos.y * 48;
      image.css("background-position", -imageX + "px " + -imageY + "px")
      
      name.text(unit.name);
      
      item.append(image);
      item.append(name);
      
      forEachProperty(rules.terrains, function(terrain) {
        var canTraverse = movementType.effectMap[terrain.id] !== null;
        var defense = unit.defenseMap[terrain.id];
        var defenseItem = $("<td></td>");
        if(canTraverse) {
          defenseItem.text(defense !== undefined ? defense : terrain.defense);
        } else {
          defenseItem.text("-");
        }
        item.append(defenseItem);
      });
      
      defenses.append(item);
    });
  }
  
  function populateMovement(rules) {
    var movements = $("#movement tbody");
    forEachProperty(rules.movementTypes, function(movementType) {
      var item = $("<tr></tr>");
      var name = $("<td></td>");
      
      name.text(movementType.name);
      item.append(name);
      
      forEachProperty(rules.terrains, function(terrain) {
        var cost = movementType.effectMap[terrain.id];
        cost = cost !== undefined ? cost : 1;
        var movementItem = $("<td></td>");
        movementItem.text(cost !== null ? cost : "-");
        item.append(movementItem);
      });
      
      movements.append(item);
    });
  }
  
}();
