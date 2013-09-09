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
            if (true === $this->get('security.context')->isGranted('ROLE_ADMIN')) {
                $userSession->setIsAdmin(true);
            }
            if (true === $this->get('security.context')->isGranted('ROLE_MODERATOR')) {
                $userSession->setIsMod(true);
            }
            $em = $this->getDoctrine()->getManager();
            $em->persist($userSession);
            $em->flush();
        }
        
        $config = $this->container->getParameter('seyon_nodejs_chat');
        $config['username'] = $username;
        $config['hash'] = $hash;
        $config['uid'] = md5($session->getId()); // create a unique id
        
        $translator     = $this->get('translator');
        $translations = array(
            'user_joined' => $translator->trans('user.joined'),
            'user_leaves' => $translator->trans('user.leaves')
        );
        
		return array(
            'seyon_nodejs_chat_trans' => json_encode($translations),
			'seyon_nodejs_chat_config' => json_encode($config)
		);
    }
}