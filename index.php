<?php
include 'lib.php' ;
html_head(
	'Main page',
	array(
		'style.css'
		, 'index.css'
		, 'options.css'
	),
	array(
		'lib/jquery.js'
		, 'lib/jquery.cookie.js'
		, '../variables.js.php'
		, 'deck.js'
		, 'html.js'
		, 'index.js'
		, 'math.js'
		, 'tournament/lib.js'
		, 'options.js'
		, 'image.js'
	), 
	array(
		'Canceled tournaments' => 'rss/tournaments.php?status=0', 
		'Pending tournaments' => 'rss/tournaments.php?status=1', 
		'Started tournaments' => 'rss/tournaments.php?status=5', 
		'Ended tournaments' => 'rss/tournaments.php?status=6' 
	)
) ;
?>

 <body>
<?php
html_menu() ;
include 'includes/Browser.php' ;
$browser = new Browser();
if( ( $browser->getBrowser() != Browser::BROWSER_FIREFOX ) || ( $browser->getVersion() < 5 ) ) {
?>
   <p id="browser" class="section">In order to enjoy every functionnalities of this game, i <strong>really</strong> encourage you to play it under <a href="http://www.mozilla.com/">Firefox 5.0+</a> and you are <strong>not</strong> (<a href="doc/browsers.php">Why ?</a>)</p>
<?php
}
?>

  <div id="left_col"><!-- ---------- LEFT COLUMN ---------- -->

<?php include 'index_tournaments.php' ; ?>

  </div><!-- id="left_col" --><!-- ---------- / LEFT COLUMN ---------- -->

  <div id="right_col"><!-- ---------- RIGHT COLUMN ---------- -->


<?php
include 'index_decks.php' ;
include 'index_duels.php' ;
?>

  </div><!-- id="right_col" --><!-- ---------- / RIGHT COLUMN ---------- -->

  <div id="footer" class="section"><a href="https://github.com/spider312/mtgas">MTGAS developpement version</a>, hosted by <a href="mailto:mtg@spiderou.net">SpideR</a></div>
<?php
if ( is_file('footer.php') )
	include 'footer.php' ;
?>
 </body>
</html>
