<?

namespace Seyon\Nodejs\ChatBundle\Entity;


use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="nodejs_chat_session")
 */
class Session { 

    /**
     * @ORM\Id
     * @ORM\Column(type="integer", nullable=false)
     */
    protected $user_id;

    /**
     * @ORM\Id
     * @ORM\Column(type="string", nullable=false)
     */
    protected $hash;

    /**
     * @ORM\Column(type="boolean", nullable=false)
     */
    protected $isAdmin = false;

    /**
     * @ORM\Column(type="boolean", nullable=false)
     */
    protected $isMod = false;
    
    public function setUserId($value){
        $this->user_id = $value;
    }
    
    public function setHash($value){
        $this->hash = $value;
    }
    
    public function setIsAdmin($value){
        $this->isAdmin = $value;
    }
    
    public function setIsMod($value){
        $this->isMod = $value;
    }
    
    public function getUserId(){
        return $this->id;
    }
    
    public function getHash(){
        return $this->hash;
    }
    
    public function getIsAdmin(){
        return $this->isAdmin;
    }
    
    public function getIsMod(){
        return $this->isMod;
    }
    
}