<?php
require_once ('jpgraph/jpgraph.php');
require_once ('jpgraph/jpgraph_line.php');

$datay1 = json_decode(file_get_contents('prices.txt'), true);

// Setup the graph
$graph = new Graph(311,261);
$graph->SetScale("textlin");

$theme_class=new UniversalTheme;

$graph->SetTheme($theme_class);
$graph->img->SetAntiAliasing(true);
$graph->SetBox(false);

$graph->SetMargin(40,10,10,10);

$graph->img->SetAntiAliasing();

$graph->yaxis->HideZeroLabel();
$graph->yaxis->HideLine(false);
$graph->yaxis->SetColor("#999");
$graph->xaxis->SetColor("#999");
$graph->yaxis->HideTicks(false,false);

$graph->SetColor("#222");
$graph->xgrid->Show();
$graph->xgrid->SetLineStyle("solid");
$graph->xgrid->SetColor('#222222');



$graph->SetMarginColor('#222');
$graph->SetFrame(true,'#222', 0);

// Create the first line
$p1 = new LinePlot($datay1);
$graph->Add($p1);
$p1->SetColor("orange");

// Output line
$graph->Stroke();



