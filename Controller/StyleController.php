<?

namespace Seyon\Nodejs\ChatBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;


class StyleController extends Controller  
{
		
    /**
     * @Template()
     * @return array
     */
    public function defaultAction()
    {
        
        $user       = $user = $this->getUser();
        $username   = 'Anonymous';
        $userId     = 0;
        $hash       = '';
        $session    = $this->getRequest()->getSession();
        $config = $this->container->getParameter('seyon_nodejs_chat');
        
        if(is_object($user)){
            $username       = $user->getUsername();
            $userId         = $user->getId();
            $hash           = $user->getPassword(); // encoded PW for access hash
            $hash           = md5($hash); // double secure if the userprovider save the PW in plain and not encoded....
            $repository     = $this->getDoctrine()->getRepository('SeyonNodejsChatBundle:Session');
            $userSession    = $repository->findOneBy(array('user_id' => $userId));
            if(!is_object($userSession)){
                $userSession = new \Seyon\Nodejs\ChatBundle\Entity\Session();
                $userSession->setUserId($userId);
                $userSession->setHash($hash);
            }
            if (true === $this->get('security.context')->isGranted($config['roles']['admin'])) {
                $userSession->setIsAdmin(true);
            }
            if (true === $this->get('security.context')->isGranted($config['roles']['moderator'])) {
                $userSession->setIsMod(true);
            }
            $em = $this->getDoctrine()->getManager();
            $em->persist($userSession);
            $em->flush();
        }
        
        $config['username']     = $username;
        $config['hash']         = $hash;
        
        $translator     = $this->get('translator.default');
        
        $translations = array(
            'user_joined',
            'user_leaves',
            'connection_success',
            'connection_wait',
            'connection_error',
            'report_question',
            'report_success',
            'report_success_notice',
            'userlist_label_admin',
            'userlist_label_mod',
            'userlist_label_default',
            'force_reload',
            'contextmenu_wisper',
            'contextmenu_mute',
            'contextmenu_kick',
            'contextmenu_ban',
            'kicked',
            'muted',
            'was_kicked'
        );
        
        $translationArray = array();
        
        foreach($translations as $key){
            $translationArray[$key] = $translator->trans($key);
        }
        
		return array(
            'seyon_nodejs_chat_trans' => json_encode($translationArray),
			'seyon_nodejs_chat_config' => json_encode($config),
            'seyon_nodejs_chat_username' => $username,
            'seyon_nodejs_chat_template' => $config['template']
		);
    }
}