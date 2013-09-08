<?
namespace Seyon\Nodejs\ChatBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('seyon_nodejs_chat');

        $rootNode
            ->children()
                ->scalarNode('template') 
                    ->defaultValue('SeyonNodejsChatBundle::layout.html.twig')
                ->end()
            ->end();

        return $treeBuilder;
    }
}