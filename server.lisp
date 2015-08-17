(setf sb-impl::*default-external-format* :UTF-8)
(declaim (optimize (debug 3)))
(ql:quickload '(hunchentoot cl-prevalence cl-html5-parser drakma cl-ppcre cl-cron cl-json))

(in-package :cl-prevalence)
(defgeneric find-objects-with-slot (system class slot value &optional test)
  (:documentation "Find and return the object in system of class with slot equal to value, null if not found"))
;;Multiple Returns
(defmethod find-objects-with-slot ((system prevalence-system) class slot value &optional (test #'equalp))
  "Find and return the object in system of class with slot equal to value, null if not found"
  (let* ((result))
	(loop :for object :in (find-all-objects system class)
	   :do (when (funcall test value (slot-value object slot))
			 (push object result)))
	result))
(export 'find-objects-with-slot)

(defpackage whereisjob
  (:use :cl :hunchentoot :html5-parser :cl-ppcre :cl-cron :json))
(in-package :whereisjob)
;; Start Hunchentoot
(setf *show-lisp-errors-p* t)
(setf *acceptor* (make-instance 'hunchentoot:easy-acceptor
                                :port 8083
                                :access-log-destination "log/access.log"
                                :message-log-destination "log/message.log"
                                :error-template-directory  "www/errors/"
                                :document-root "www/"))
(start *acceptor*)

(defun current-month ()
  (fifth (multiple-value-list (decode-universal-time (get-universal-time)))))

;;Init p-system
(defclass job()
  ((id :reader id
       :initarg :id)
   (tid :accessor tid
        :initarg :tid)
   (user :accessor user
         :initarg :user)
   (avatar :accessor avatar
        :initarg :avatar)
   (remote :accessor remote
           :initarg :remote)
   (title :accessor title
           :initarg :title)
   (cities :accessor cities
           :initarg :cities)
   (company :accessor company
            :initarg :company)
   (site :accessor site
         :initarg :site)
   (email :accessor email
          :initarg :email)
   (content :accessor content
            :initarg :content)
   (month :accessor month
          :initform (current-month))))

(defvar *p-system* (cl-prevalence:make-prevalence-system #p"./p-system/"))
(or (> (length (cl-prevalence:find-all-objects *p-system* 'item)) 0)
	(cl-prevalence:tx-create-id-counter *p-system*))


(defvar *city-list* '("remote" "远程" "安徽" "福建" "甘肃" "广东" "贵州" "河北" "黑龙江" "河南" "湖北" "湖南" "吉林" "江西" "江苏" "辽宁" "山东" "陕西" "山西" "四川" "云南" "浙江" "青海" "海南" "台湾" "广西" "内蒙" "宁夏" "西藏" "新疆" "北京" "天津" "上海" "重庆" "合肥" "宿州" "淮北" "阜阳" "蚌埠" "淮南" "滁州" "马鞍山" "芜湖" "铜陵" "安庆" "黄山" "六安" "池州" "宣城" "亳州" "厦门" "福州" "南平" "三明" "莆田" "泉州" "漳州" "龙岩" "宁德" "兰州" "嘉峪关" "金昌" "白银" "天水" "酒泉" "张掖" "武威" "庆阳" "平凉" "定西" "陇南" "广州" "深圳" "清远" "韶关" "河源" "梅州" "潮州" "汕头" "揭阳" "汕尾" "惠州" "东莞" "珠海" "中山" "江门" "佛山" "肇庆" "云浮" "阳江" "茂名" "湛江" "贵阳" "六盘水" "遵义" "安顺" "毕节" "铜仁石家庄" "邯郸" "唐山" "保定" "秦皇岛" "邢台" "张家口" "承德" "沧州" "廊坊" "衡水" "哈尔滨齐齐哈尔" "黑河" "大庆" "伊春" "鹤岗" "佳木斯" "双鸭山" "七台河" "鸡西" "牡丹江" "绥化" "郑州" "开封" "洛阳" "平顶山" "安阳" "鹤壁" "新乡" "焦作" "濮阳" "许昌" "漯河" "三门峡" "南阳" "商丘" "周口" "驻马店" "信阳" "武汉" "十堰" "襄阳" "荆门" "孝感" "黄冈" "鄂州" "黄石" "咸宁" "荆州" "宜昌" "随州" "长沙" "衡阳" "张家界" "常德" "益阳" "岳阳" "株洲" "湘潭" "郴州" "永州" "邵阳" "怀化" "娄底" "长春" "吉林" "白城" "松原" "四平" "辽源" "通化" "白山" "南昌" "九江" "景德镇" "鹰潭" "新余" "萍乡" "赣州" "上饶" "抚州" "宜春" "吉安" "南京" "徐州" "连云港" "宿迁" "淮安" "盐城" "扬州" "泰州" "南通" "镇江" "常州" "无锡" "苏州" "沈阳" "大连" "朝阳" "阜新" "铁岭" "抚顺" "本溪" "辽阳" "鞍山" "丹东" "营口" "盘锦" "锦州" "葫芦岛" "济南" "青岛" "聊城" "德州" "东营" "淄博" "潍坊" "烟台" "威海" "日照" "临沂" "枣庄" "济宁" "泰安" "莱芜" "滨州" "菏泽" "西安" "延安" "铜川" "渭南" "咸阳" "宝鸡" "汉中" "榆林" "商洛" "安康" "太原" "大同" "朔州" "阳泉" "长治" "晋城" "忻州" "吕梁" "晋中" "临汾" "运城" "成都" "广元" "绵阳" "德阳" "南充" "广安" "遂宁" "内江" "乐山" "自贡" "泸州" "宜宾" "攀枝花" "巴中" "达州" "资阳" "眉山" "雅安" "昆明" "曲靖" "玉溪" "丽江" "昭通" "普洱" "临沧" "保山" "杭州" "宁波" "湖州" "嘉兴" "舟山" "绍兴" "衢州" "金华" "台州" "温州" "丽水" "西宁" "海东" "海口" "三亚" "三沙" "儋州" "南宁" "桂林" "柳州" "梧州" "贵港" "玉林" "钦州" "北海" "防城港" "崇左" "百色" "河池" "来宾" "贺州" "呼和浩特" "包头" "乌海" "赤峰" "呼伦贝尔" "通辽" "乌兰察布" "鄂尔多斯" "巴彦淖尔" "银川" "石嘴山" "吴忠" "中卫" "固原" "拉萨" "日喀则" "昌都" "林芝" "乌鲁木齐" "克拉玛依" "吐鲁番"))

(defun flex-dom-map (recurse-p fn node)
  "fn is applied to each visited node
   recurse-p controls whether to visit the children of node"
  (if node
      (progn
        (funcall fn node) ;apply the function to the node
        (if (funcall recurse-p node)
            (html5-parser:element-map-children 
             (lambda (n-node) (flex-dom-map recurse-p fn n-node)) node)))))

(defun standard-recurse-p (node)
  "returns true only if you aren't trying to recurse into a script,
  style, or noscript tag."
  (not (or (equalp (node-name node) "script")
           (equalp (node-name node) "style")
           (equalp (node-name node) "noscript"))))


(defun scrape-text (top-node recurse-p)
  (with-output-to-string (s) 
    (flex-dom-map
     recurse-p
     (lambda (node) (if (equal (node-type node) :TEXT)
                   (format s " ~a " (node-value node))))
     top-node)))

(defun get-jobs-dom(page)
  (format t "REQUESTING PAGE... ~A ~A" page #\newline)
  (multiple-value-bind (jobs-html)
      (drakma:http-request (concatenate 'string "http://v2ex.com/go/jobs?p=" page))
    (parse-html5 jobs-html)))

(defun get-job-list (root-node)
  "this function maps its way through the DOM nodes till it finds a 
   node with name 'div' and 'class' attribute has 'cell from_', 
   then suck the poster and thread id from this node"
  (let ((job-list nil))
    (flex-dom-map #'standard-recurse-p
                  (lambda (node)
                    (if (equalp (node-name node) "div")
                        (let* ((class-name (element-attribute node "class"))
                               (ids (cl-ppcre:split " " (cl-ppcre:regex-replace-all "cell from_|t_" class-name ""))))
                          (if (and (search "cell from_" class-name) (search " •  1 天前  • " (scrape-text node #'standard-recurse-p)))
                              (progn
                                (format t "USER: ~a,THREAD:~a ~a" (car ids) (cadr ids) #\newline)
                                (push ids job-list))))))
                  root-node)
    job-list))

(defun get-yesterday-job-list()
  (do* ((page 0 (+ 1 page))
        (job-list "init" (get-job-list (get-jobs-dom (write-to-string page))))
        (final-list nil (append job-list final-list))
        (job-found nil (or job-found (not (null job-list)))))
       ((and job-found (null job-list))
        final-list)))

(defun get-job-dom(tid)
  (format t "REQUESTING PAGE... ~A ~A" tid #\newline)
  (multiple-value-bind (job-html)
      (drakma:http-request (concatenate 'string "http://v2ex.com/t/" tid))
    (parse-html5 job-html)))

(defun get-content-node (root-node)
  "this function maps its way through the DOM nodes till it finds a 
   node with name 'div' and 'class' attribute equal to 'topic_content', 
   then returns that node"
    (flex-dom-map #'standard-recurse-p
     (lambda (node)
       (if (equalp (node-name node) "div")
       (if (equalp (element-attribute node "class") "topic_content")
           (return-from get-content-node node))))
     root-node))

(defun get-avatar (root-node)
  "this function maps its way through the DOM nodes till it finds a 
   node with name 'img' and 'class' attribute equal to 'avatar', 
   then returns src of that node"
    (flex-dom-map #'standard-recurse-p
     (lambda (node)
       (if (equalp (node-name node) "img")
       (if (equalp (element-attribute node "class") "avatar")
           (return-from get-avatar (element-attribute node "src")))))
     root-node))

(defun get-content-text (root-node)
  (let ((job-node (get-content-node root-node)))
    (scrape-text job-node #'standard-recurse-p)))

(defun get-title (root-node)
  (flex-dom-map
   #'standard-recurse-p
   (lambda (node) (if (equalp (node-name node) "title")
                 (return-from get-title
                   (let* ((title-ori (node-value (node-first-child node)))
                         (title-length (length title-ori)))
                     (subseq title-ori 0 (- title-length 7))))))
   root-node))

(defun get-cities(title)
  (setf title (regex-replace-all "远程" (string-downcase title) "remote"))
  (let* ((city-list-ori
          (split "or| |　|/|\\||｜"
                 (regex-replace-all "\\[|\\]|【|】|「|」|［|］|（|）"
                                    (scan-to-strings "\\[.*?\\]|【.*?】|「.*?」|［.*?］|（.*?）" title) "")))
         (city-list-final nil))
    (dolist (city city-list-ori)
      (let* ((city (find city *city-list* :test #'equal)))
        (if city (push city city-list-final))))
    (or city-list-final
        ;;if till no city, then search all the city in the title
        (progn
          (mapcar
           #'(lambda (city)
               (let* ((city-found (scan-to-strings city title)))
                 (if city-found (push city-found city-list-final))))
           *city-list*)
          city-list-final))))

(defun get-keyword(job-dom keyword)
  (let* ((lines (split #\newline (get-content-text job-dom)))
         (word nil))
    (dolist (line lines)
      (if (scan-to-strings (concatenate 'string ".*?" keyword ".*?[：|:].*?")  line)
          (setf word (cadr (split ":|：" line)))))
    (string-trim " " word)))

(defun create-job(tid user avatar remote title cities company site email content)
  (cl-prevalence:tx-create-object
   *p-system*
   'job
   `((tid ,tid)
     (user ,user)
     (avatar ,avatar)
     (remote ,remote)
     (title ,title)
     (cities ,cities)
     (company ,company)
     (site ,site)
     (email ,email)
     (content ,content))))

(defun parse-job(job-dom tid user)
  (let* ((title (get-title job-dom))
         (avatar (get-avatar job-dom))
         (cities (get-cities title))
         (remote (if (find "remote" cities :test #'equal) t))
         (company (get-keyword job-dom "公司"))
         (site (get-keyword job-dom "网站|官网|主页"))
         (email (get-keyword job-dom "投递|邮箱|简历"))
         (content (get-content-text job-dom)))
    (create-job tid user avatar remote title cities company site email content))
  (format t "~A ///" (get-title job-dom)))

(defun find-job-by-tid(tid)
  (cl-prevalence:find-object-with-slot *p-system* 'job 'tid tid))

(defun parse-job-list(job-list)
  (progn
    (dolist (job job-list)
      (if (find-job-by-tid (cadr job))
          (format t "SUCKED, Skiping... ~A ~A " (cadr job) #\newline)
          (parse-job
           (get-job-dom (cadr job))
           (cadr job)
           (car job))))
    (cl-prevalence:snapshot *p-system*)))

(defun find-current-jobs()
  (append (cl-prevalence:find-objects-with-slot *p-system* 'job 'month (current-month))
          (cl-prevalence:find-objects-with-slot *p-system* 'job 'month (- (current-month) 1))))

(defclass job-cities()
  ((id :accessor id
          :initarg :id)
   (cities :accessor cities
            :initarg :cities)))

(defun find-current-cities()
  (let* ((city-list nil))
    (mapcar
     #'(lambda(job)
         (if (cities job) (push
                           (make-instance 'job-cities :cities (cities job) :id (id job))
                           city-list)))
     (find-current-jobs))
    city-list))

(defun find-jobs-by-city(city)
  (let* ((result))
	(loop :for job :in (find-current-jobs)
	   :do (when (find city (cities job) :test #'equal)
			 (push job result)))
	result))

(defun find-job-by-id(id)
  (cl-prevalence:find-object-with-id *p-system* 'job id))

(defun controller-cities()
  (setf (hunchentoot:content-type*) "application/json")
  (encode-json-to-string (find-current-cities)))

(defun controller-jobs-by-city()
  (setf (hunchentoot:content-type*) "application/json")
  (encode-json-to-string (find-jobs-by-city (parameter "city"))))

(defun controller-job()
  (setf (hunchentoot:content-type*) "application/json")
  (encode-json-to-string (find-job-by-id (parse-integer (parameter "id") :junk-allowed t))))

(setf *dispatch-table*
      (list
       (create-regex-dispatcher "^/cities$" 'controller-cities)
       (create-regex-dispatcher "^/jobs$" 'controller-jobs-by-city)
       (create-regex-dispatcher "^/job$" 'controller-job)))


;;Cron Job
(defun suck-v2ex ()
  (parse-job-list (get-yesterday-job-list)))
(make-cron-job #'suck-v2ex :minute 30 :hour 23)
;;(start-cron)
