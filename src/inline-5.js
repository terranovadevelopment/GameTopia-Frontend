
    if(new URLSearchParams(location.search).has("size")){
      for(const name of ["game-data", "hex-map", "routes", "zoc", "movement", "combat", "sound", "supply", "city", "replacements", "strategic-ai", "ai-operations", "recovery-state", "app"]) document.write('<script src="src/'+name+'.js?v=6.189"><\/script>');
    }
  