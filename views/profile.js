<!doctype html>
<html>
  <head>
  <title>Chessbond</title>
     <!-- Viewport mobile tag for sensible mobile support -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

      <!--STYLES-->
      <link rel="stylesheet" href="/styles/angular-toastr.css">
      <link rel="stylesheet" href="/styles/bootstrap.3.1.1.css">
      <link rel="stylesheet" href="/styles/css/chessboard-0.3.0.min.css">
      <link rel="stylesheet" href="/styles/importer.css">
      <!--STYLES END-->
    <script type="text/javascript">
    window.SAILS_LOCALS = {
      _csrf: '<%= _csrf %>'
       <% if (loggedin==true){ %>
      ,
      me: <%- JSON.stringify(me) %>
      
      <% } %>
      };
    </script>
       <!--SCRIPTS-->
       <script src="/js/dependencies/sails.io.js"></script>
       <script src="/js/dependencies/angular.1.3.js"></script>
       <script src="/js/dependencies/jquery-1.10.1.min.js"></script>
       <script src="/js/dependencies/angular-toastr.js"></script>
       <script src="/js/dependencies/bootstrap.min.js"></script>
       <script src="/js/dependencies/chess.min.js"></script>
       <script src="/js/dependencies/chessboard-0.3.0.min.js"></script>
       <script src="/js/dependencies/compareTo.module.js"></script>
       <script src="/js/dependencies/enginegame.js"></script>
       <script src="/js/dependencies/stockfish.js"></script>
       <script src="/js/public/signup/SignupModule.js"></script>
       <script src="/js/private/dashboard/DashboardModule.js"></script>
       <script src="/js/public/homepage/HomepageModule.js"></script>
       <script src="/js/private/dashboard/DashboardController.js"></script>
       <script src="/js/public/homepage/HomepageController.js"></script>
       <script src="/js/public/signup/SignupController.js"></script>
       <!--SCRIPTS END-->
    
   
  </head>
  <body ng-app="HomepageModule" ng-controller="HomepageController" ng-cloak>
  <%- include partials/navbar.ejs %>
    <div class="row">
      <div class="col-sm-7 col-md-6">
        <span class="h3" id="time1">0:05:00</span>
        <div id="board" style="width: 400px"></div>
        <span class="h3" id="time2">0:05:00</span>
        <hr>
        <div id="engineStatus">...</div>
      </div>
      <div class="col-sm-5 col-md-6">
        <h3>Moves:</h3>
        <div id="pgn"></div>
        <hr>
        <form class="form-horizontal">
          <div class="form-group">
            <label for="timeBase" class="control-label col-xs-4 col-sm-6 col-md-4">Base time (min)</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <input type="number" class="form-control" id="timeBase" value="5">
            </div>
          </div>
          <div class="form-group">
            <label for="timeInc" class="control-label col-xs-4 col-sm-6 col-md-4">Increment (sec)</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <input type="number" class="form-control" id="timeInc" value="2">
            </div>
          </div>
          <div class="form-group">
            <label for="skillLevel" class="control-label col-xs-4 col-sm-6 col-md-4">Skill Level (0-20)</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <input type="number" class="form-control" id="skillLevel" value="0">
            </div>
          </div>
          <div class="form-group">
            <label for="color" class="control-label col-xs-4 col-sm-6 col-md-4">I play</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <div class="btn-group" data-toggle="buttons">
                <label class="btn btn-primary active" id="color-white"><input type="radio" name="color">White</label>
                <label class="btn btn-primary" id="color-black"><input type="radio" name="color">Black</label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="showScore" class="control-label col-xs-4 col-sm-6 col-md-4">Show score</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <input type="checkbox" class="form-control" id="showScore" checked>
            </div>
          </div>
          <div class="form-group">
            <label for="color" class="control-label col-xs-4 col-sm-6 col-md-4"></label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <button type="button" class="btn btn-primary" onclick="newGame()">New Game</button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="color" class="control-label col-xs-4 col-sm-6 col-md-4">Promote to</label>
            <div class="col-xs-4 col-sm-6 col-md-4">
              <select id=promote>
                <option value=q selected>Queen</option>
                <option value=r>Rook</option>
                <option value=b>Bishop</option>
                <option value=n>Knight</option>
              </select>
            </div>
          </div>
        </form>
        <h5>Evaluation</h5>
        <pre id=evaluation></pre>
    </div>
    <!--<script src="enginegame.js"></script>-->
    <script>
      var wait_for_script;
      var newGame = function (){};
      
      /// We can load Stockfish.js via Web Workers or directly via a <script> tag.
      /// Web Workers are better since they don't block the UI, but they are not always avaiable.
      (function fix_workers()
      {
        var script_tag;
        /// Does the environment support web workers?  If not, include stockfish.js directly.
        ///NOTE: Since web workers don't work when a page is loaded from the local system, we have to fake it there too. (Take that security measures!)
        if (!Worker || (location && location.protocol === "file:")) {
          var script_tag  = document.createElement("script");
          script_tag.type ="text/javascript";
          script_tag.src  = "stockfish.js";
          script_tag.onload = init;
          document.getElementsByTagName("head")[0].appendChild(script_tag);
          wait_for_script = true;
        }
      }());
      
      function init()
      {
        var game = engineGame();
    
        newGame = function newGame() {
            var baseTime = parseFloat($('#timeBase').val()) * 60;
            var inc = parseFloat($('#timeInc').val());
            var skill = parseInt($('#skillLevel').val());
            game.reset();
            game.setTime(baseTime, inc);
            game.setSkillLevel(skill);
            game.setPlayerColor($('#color-white').hasClass('active') ? 'white' : 'black');
            game.setDisplayScore($('#showScore').is(':checked'));
            game.start();
        }
        
        game.setSkillLevel
        
        document.getElementById("skillLevel").addEventListener("change", function ()
        {
            game.setSkillLevel(parseInt(this.value, 10));
        });
    
        newGame();
      }
      
      /// If we load Stockfish.js via a <script> tag, we need to wait until it loads.
      if (!wait_for_script) {
        document.addEventListener("DOMContentLoaded", init);
      }
    </script>
   
  </body>
</html>