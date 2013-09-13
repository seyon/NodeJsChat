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
                ->scalarNode('ip') 
                    ->defaultValue('localhost')
                ->end()
                ->integerNode('port') 
                    ->defaultValue('3000')
                ->end()
                ->scalarNode('file') 
                    ->defaultValue('/socket.io/socket.io.js')
                ->end()
                ->booleanNode('debug') 
                    ->defaultFalse()
                ->end()
                ->arrayNode('roles') 
                    ->children()
                        ->scalarNode('admin') 
                            ->defaultValue('ROLE_ADMIN')
                        ->end()
                        ->scalarNode('moderator') 
                            ->defaultValue('ROLE_MODERATOR')
                        ->end()
                    ->end()
                ->end()
            ->end();

        return $treeBuilder;
    }
}