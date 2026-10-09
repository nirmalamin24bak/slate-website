// Filters the /calories/ list as you type. Matches dish names and aliases
// (Hindi, Gujarati and common spellings) held in each item's data-search.
// No network calls, no storage. Without JavaScript the full list shows.
(function () {
  var input = document.getElementById("hub-filter");
  if (!input) return;
  var groups = document.querySelectorAll("[data-hub-group]");
  var empty = document.getElementById("hub-empty");
  input.closest(".hub-search").hidden = false;

  function norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function apply() {
    var words = norm(input.value).split(" ").filter(Boolean);
    var shown = 0;
    groups.forEach(function (group) {
      var visible = 0;
      group.querySelectorAll("li[data-search]").forEach(function (li) {
        var hay = li.getAttribute("data-search");
        var match = words.every(function (w) { return hay.indexOf(w) !== -1; });
        li.hidden = !match;
        if (match) visible++;
      });
      group.hidden = visible === 0;
      shown += visible;
    });
    empty.hidden = shown !== 0;
  }

  input.addEventListener("input", apply);
})();
